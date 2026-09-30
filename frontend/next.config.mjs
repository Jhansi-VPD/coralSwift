/** @type {import('next').NextConfig} */

// The UI is a pure client of the standalone FastAPI backend, so the browser
// must be allowed to fetch the API origin cross-origin. Beyond the standard
// dev ports, honor NEXT_PUBLIC_API_URL (loaded from .env.local before this
// file is evaluated) so production/staging API origins work without edits.
const apiOrigins = new Set(['http://localhost:8000']);
try {
  if (process.env.NEXT_PUBLIC_API_URL) {
    apiOrigins.add(new URL(process.env.NEXT_PUBLIC_API_URL).origin);
  }
} catch {
  // ignore malformed env value; defaults still apply
}

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co ${Array.from(apiOrigins).join(' ')}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '0',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      headers[0].headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return headers;
  },
};

export default nextConfig;
