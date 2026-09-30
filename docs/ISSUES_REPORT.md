# CORALSWIFT TECHNOLOGIES
## Code Review — Issue Analysis & Findings

**Review scope**: Frontend, backend API routes, database migrations, security architecture
**Date**: September 29, 2026
**Document status**: Informational — no changes have been committed or pushed

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Issue Severity Index](#2-issue-severity-index)
3. [Critical Issues](#3-critical-issues)
4. [High Severity Issues](#4-high-severity-issues)
5. [Medium Severity Issues](#5-medium-severity-issues)
6. [Structural / Maintainability Issues](#6-structural--maintainability-issues)
7. [What Is Done Well](#7-what-is-done-well)
8. [Recommended Fix Order](#8-recommended-fix-order)

---

## 1. Executive Summary

The CoralSwift project is a Next.js 14 (App Router) + Supabase full-stack application comprising a public marketing site, a careers/job board, an executive admin portal, and a PostgreSQL database layer defined through SQL migrations.

**The skeleton is correct**: the folder structure follows idiomatic Next.js conventions, the Supabase client architecture (anon / SSR / service-role) is textbook, the edge middleware auth design is sound, and the RLS migration hardening is deliberate and well documented.

**However, five defects undermine correctness and the project's own security claims**:

1. The admin portal UI gate trusts a forgeable browser flag.
2. Several admin API endpoints report success even when the database operation failed.
3. The résumé upload pipeline is broken end-to-end (upload fails silently; retrieval cannot work).
4. Login audit events are never persisted due to an RLS/client mismatch.
5. The login rate limiter evaporates on serverless infrastructure.

Everything else is hardening and hygiene. Sections below explain each issue: where it lives, why it happens, and the practical impact.

---

## 2. Issue Severity Index

| # | Severity | Title | Primary File(s) |
|---|----------|-------|-----------------|
| 1 | 🔴 Critical | Admin UI gate is cosmetic (localStorage trust) | `frontend/src/app/admin/layout.tsx` |
| 2 | 🔴 Critical | Admin API returns fake success on failure | `frontend/src/app/api/admin/enquiries/route.ts` (+ settings, audit-logs, applications) |
| 3 | 🟠 High | Résumé upload pipeline broken end-to-end | `frontend/src/lib/api.ts`, `JobApplicationModal.tsx`, `ResumePreviewModal.tsx` |
| 4 | 🟠 High | Login audit events never persisted | `frontend/src/app/admin/login/page.tsx` |
| 5 | 🟡 Medium | In-memory rate limiting ineffective on serverless | `frontend/src/lib/rate-limit.ts` |
| 6 | 🟡 Medium | Timing-unsafe password comparison | `frontend/src/app/api/admin/login/route.ts` |
| 7 | 🟡 Medium | CSP weakened by `unsafe-eval` / `unsafe-inline` | `frontend/next.config.mjs` |
| 8 | 🟡 Medium | Sitemap generated from static mock data only | `frontend/src/app/sitemap.ts` |
| 9 | ⚪ Structural | 1,027-line dual-mode API monolith | `frontend/src/lib/api.ts` |
| 10 | ⚪ Structural | Assorted smells (duplicated IP helper, regex duplicate detection, client-side delete ghosting, zero tests) | various |

---

## 3. Critical Issues

### Issue 1 — The admin portal lock on the screen is fake

**Where**: `frontend/src/app/admin/layout.tsx` (line ~20)

The admin dashboard decides "should you see this page?" by checking:

```js
localStorage.getItem('coralswift_admin_auth') === 'true'
```

`localStorage` is a thing **the user** can edit in their own browser. Anyone can press F12 → Console → type `localStorage.setItem('coralswift_admin_auth', 'true')` → refresh → the entire admin portal UI renders for them.

**Why it happens**: The login page saves that flag after a *successful* login, so normally only authenticated users have it. But nothing verifies it — it is an "honor system" flag. The correct verifier already exists (`/api/admin/me` checks the real signed HMAC cookie) — the layout simply never calls it.

**Actual risk**: Low-to-medium. The real data APIs are protected by edge middleware (that part is solid), so a trespasser sees an empty dashboard full of failed fetches. But it exposes the admin UI structure, and it trains developers to trust client-side auth. This is the kind of finding that fails a security review.

**Recommended fix**: In `admin/layout.tsx`, replace the localStorage check with a `fetch('/api/admin/me')` call and gate rendering on `authenticated: true`. Update logout to clear the session cookie (and the localStorage flag) via a server round-trip.

---

### Issue 2 — Admin actions report "success" even when they failed

**Where**: `frontend/src/app/api/admin/enquiries/route.ts` — PATCH and DELETE handlers. The same pattern exists in `settings`, `audit-logs`, and `applications` admin routes.

Look at the catch block:

```js
} catch (error) {
  return NextResponse.json({ success: true, message: 'Fallback mode active' });
}
```

If the database update of an enquiry **throws an error**, the API still answers `success: true`. So an admin marks an enquiry "qualified," the DB write fails, the UI shows success — and the enquiry silently stays "new" forever. Same for DELETE: the admin thinks they deleted a record; it is still there.

**Why it happens**: It was written as a "zero-config fallback" so the demo works without Supabase. But the fallback cannot distinguish "no DB configured" from "DB write failed."

**Why this one stings**: The project's own `supabase/REMEDIATION_REPORT.md` documents fixing exactly this bug pattern in the *frontend* (finding F-025: "Removed `setIsSuccess(true)` from catch block; failed submissions now display an error instead of fake success"). The same disease survived in the admin API.

**Recommended fix**: Only return the fallback response when Supabase is genuinely unconfigured (`createAdminClient()` returned null). When the client exists and the operation throws, return a real error status (500) with the error message so the admin UI can display it.

---

## 4. High Severity Issues

### Issue 3 — Résumé uploads probably never reach the database

**Where**: `frontend/src/lib/api.ts` (`submitApplication`, ~lines 370–450), `frontend/src/components/forms/JobApplicationModal.tsx` (~line 182), `frontend/src/components/forms/ResumePreviewModal.tsx`

Three chained problems:

1. **Upload happens in the candidate's browser** using the public anon key, into the `resumes` bucket — which is **private** by design. Neither migration defines any Storage policy allowing anon uploads, so Supabase rejects the upload. The failure is swallowed by `console.warn`, so nobody notices.
2. **The fallback path is a fake path.** When upload fails, the code writes a string like `/uploads/resumes/1727..._resume.pdf` into the DB — a file location that exists nowhere. The record looks complete but points at nothing.
3. **Admin retrieval cannot work either.** The admin side uses `getPublicUrl()` on that private bucket — but private buckets do not serve public URLs. It needs `createSignedUrl()`. Also, the base64 `resume_url` the modal computed is silently dropped before insert (it is never included in the DB payload).

**Net effect**: Candidates get a success screen; admins see an application with a résumé that will not open. The careers pipeline — a core feature — is effectively decorative in Supabase mode.

**Recommended fix**: Move the upload server-side into an API route that uses `createAdminClient()` (service-role), store the storage path, and generate short-lived signed URLs (`createSignedUrl`) when the admin views an application. Optionally add a Storage RLS policy allowing authenticated (admin) access only.

---

### Issue 4 — Login events are never written to the audit log

**Where**: `frontend/src/app/admin/login/page.tsx` (~line 60)

After login, the **browser** calls `logAuditAction(...)`, which tries to insert into `audit_logs` using the anon key. But the hardened RLS (`supabase/migrations/20260917000000_secure_rls_policies.sql`) gives anonymous users **zero** insert permission on `audit_logs` — on purpose. So the insert is rejected and login auditing silently does nothing.

**Why it matters**: The admin portal advertises an "immutable security audit log," but the most security-relevant event — who logged in, when, from where — is never captured. (Server-side CRUD actions *do* get logged correctly, because they run with the service-role key.)

**Recommended fix**: Log the login event inside `/api/admin/login/route.ts` after successful authentication, using the service-role client. Remove the client-side `logAuditAction` call from the login page.

---

## 5. Medium Severity Issues

### Issue 5 — Login rate limiting does not actually work in production

**Where**: `frontend/src/lib/rate-limit.ts`

It stores attempt counts in a JavaScript `Map` **in the server process's memory**. On Vercel, every serverless function invocation may run in a **different, ephemeral container**. The "5 attempts per 15 minutes" limit is therefore per-container — an attacker hitting `/api/admin/login` in parallel gets effectively unlimited guesses, because each request can land in a fresh container.

Ironically, `@upstash/redis` is already in `package.json` (it exists precisely to fix this) but is never imported.

**Related gap**: There is **no rate limit at all** on the public enquiry/application forms — anyone can spam the intake pipeline.

**Recommended fix**: Back the login limiter with Upstash Redis (sliding window or fixed window), and add a second, more generous limiter to `/api/enquiries/submit` and the application endpoint.

---

### Issue 6 — Password check is vulnerable to timing attacks

**Where**: `frontend/src/app/api/admin/login/route.ts` (~line 63)

`password === configuredPassword` — string comparison returns at the first mismatched character, so response-time analysis can in principle leak the password one character at a time. Node's `crypto.timingSafeEqual` exists for exactly this.

Exploitability is low in practice (network jitter masks microsecond differences), but the fix is free:

```ts
import { timingSafeEqual } from 'crypto';
const a = Buffer.from(password);
const b = Buffer.from(configuredPassword);
const ok = a.length === b.length && timingSafeEqual(a, b);
```

---

### Issue 7 — The Content-Security-Policy undermines itself

**Where**: `frontend/next.config.mjs`

`script-src 'self' 'unsafe-eval' 'unsafe-inline'` — those two allowances mean the CSP provides **almost no XSS protection**, which is CSP's main job. The rest of the header set (HSTS, frame-deny, nosniff, Permissions-Policy) is good; this one line defeats the headline feature.

**Recommended fix**: Move to nonce- or hash-based script sourcing. With Next.js this requires a middleware that generates a nonce per request and threads it through CSP headers. Alternatively, at minimum drop `unsafe-eval` (needed only for dev-mode hot reload) in production.

---

### Issue 8 — Sitemap never reflects reality

**Where**: `frontend/src/app/sitemap.ts`

It imports directly from `mock-data.ts`. If the admin edits services, adds a job, or renames a case study, Google's sitemap still shows the original hardcoded entries. Dynamic routes need the sitemap to read from the database.

**Recommended fix**: Make `sitemap.ts` async and query published services/case studies/active jobs through the existing data layer (or call the public API routes), falling back to mock data when Supabase is unconfigured.

---

## 6. Structural / Maintainability Issues

### Issue 9 — `lib/api.ts` is one 1,027-line file doing three jobs

Every function has this shape:

```
if (in browser)  → fetch my own API route
else             → try Supabase → fall back to in-memory mock data
```

This triple-fallback (Issue 2's root cause) means:

- No single place defines "how data is accessed."
- Bugs hide behind silent fallbacks.
- Every route file re-imports this god-module.

The clean shape is `lib/server/*` (DB access, service-role only, used exclusively by API routes) + a thin client fetch layer. Issues 2, 3, and 4 would all have been structurally impossible in that layout.

### Issue 10 — Assorted smells

| Smell | Location | Note |
|-------|----------|------|
| `getAuditIp()` copy-pasted identically into 3 route files | `services`, `jobs`, `case-studies` routes | Should be one shared util. |
| Duplicate-booking check parses free-text message with regex (`[Booked Consultation:`) | `api/enquiries/submit/route.ts` | Brittle; a dedicated `booking_date`/`booking_slot` schema field would be robust. |
| `deletedServiceIds` / `deletedCaseStudyIds` client-side Sets | `lib/api.ts` | Deletes done in one browser tab "resurrect" in another, because the ghost-list is per-session memory. |
| Zero automated tests | entire project | No test runner configured. For a codebase whose headline features are auth and data integrity, nothing verifies any of it — including the remediation-report fixes (no regression tests). |
| `@upstash/*` dependencies declared but unused | `frontend/package.json` | Dead dependency weight until Issue 5 is fixed. |
| `enable_admin_access.sql` is superseded but still present | `supabase/` | Labeled correctly as "run secure version instead," but the permissive file invites accidental execution; consider deleting or renaming it `.disabled`. |

---

## 7. What Is Done Well

For balance, these elements are genuinely correct and should not be reworked:

- **Folder structure** — idiomatic Next.js 14 App Router organization (`app/`, `components/{forms,layout,sections,ui}`, `lib/`, collocated `api/` route handlers, dynamic `[slug]`/`[id]` segments).
- **Supabase client architecture** — clean separation of anon (`client.ts`), SSR (`server.ts`), and service-role (`admin.ts`) clients.
- **Edge middleware auth** — `/api/admin/*` and all mutating routes require a valid HMAC session; the middleware/token verify duplication (Node `Buffer` vs Edge `atob`) is deliberate and well documented.
- **RLS hardening migration** — drops permissive policies; anon gets read-only on published content and insert-only on enquiries/applications; no anon mutation of admin content.
- **Security headers** — HSTS (prod), X-Frame-Options DENY, nosniff, Permissions-Policy (aside from Issue 7).
- **Login hardening** — HttpOnly/SameSite cookie, 7-day expiry, rate-limit intent, `Retry-After` header.
- **Remediation discipline** — the documented F-findings (F-014–F-025) were real fixes with accessibility improvements, touch targets, and false-success removal in the public forms.

---

## 8. Recommended Fix Order

| Priority | Issue | Effort | Rationale |
|----------|-------|--------|-----------|
| 1 | #1 Admin session gate via `/api/admin/me` | Small | Closes the visible security hole; one file + logout flow. |
| 2 | #2 Real errors from admin API routes | Small | Restores data integrity; touches 4 route files. |
| 3 | #4 Login audit logging server-side | Trivial | One relocation; restores the advertised audit trail. |
| 4 | #3 Résumé pipeline (server-side upload + signed URLs) | Medium | Fixes a broken core feature; needs an API route + retrieval change. |
| 5 | #5 Upstash rate limiting (+ public form limits) | Medium | Requires Upstash account/env vars; eliminates serverless bypass. |
| 6 | #6 Timing-safe comparison | Trivial | Free fix while editing the login route. |
| 7 | #8 Dynamic sitemap | Small | Straightforward async rewrite. |
| 8 | #9 Split `lib/api.ts` | Large | Do opportunistically; issues 2–4 become structurally impossible afterwards. |
| 9 | #7 CSP nonce hardening | Medium | Requires middleware plumbing; schedule as a hardening pass. |
| 10 | #10 Test suite + small smells | Ongoing | Add Vitest/RTL; start with auth + admin-route regression tests. |

---

*End of report. This document is untracked working material and has not been staged, committed, or pushed.*
