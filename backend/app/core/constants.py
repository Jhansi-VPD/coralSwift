"""Shared domain constants (mirror the DB CHECK constraints)."""

ROLES = ("admin", "hr", "sales", "manager", "employee", "client")
STAFF_ROLES = ("admin", "hr", "sales", "manager", "employee")

TASK_STATUSES = ("todo", "in_progress", "in_review", "blocked", "done")
TASK_PRIORITIES = ("low", "medium", "high", "urgent")

PROJECT_STATUSES = ("planning", "active", "on_hold", "completed", "cancelled")
PROJECT_HEALTH = ("on_track", "at_risk", "critical")
CLIENT_REVIEW_STATUSES = ("not_submitted", "submitted", "changes_requested", "approved")

LEAVE_TYPES = ("annual", "sick", "unpaid", "maternity", "paternity")
LEAVE_STATUSES = ("pending", "approved", "rejected", "cancelled")

TIMESHEET_STATUSES = ("draft", "pending", "approved", "rejected")
EMPLOYEE_STATUSES = ("onboarding", "active", "on_leave", "notice_period", "exited")

PROPOSAL_STATUSES = ("draft", "sent", "accepted", "declined", "expired")
CONTRACT_STATUSES = ("draft", "active", "expired", "terminated")
LEAD_STAGES = ("new", "contacted", "qualified", "proposal_sent", "won", "lost")
ORG_STATUSES = ("prospect", "active", "churned")

INVOICE_STATUSES = ("draft", "sent", "paid", "overdue", "cancelled")
TICKET_STATUSES = ("open", "in_progress", "resolved", "closed")

REVIEW_STATUSES = ("draft", "shared", "acknowledged")

# enquiry workflow (application-level state machine)
ENQUIRY_STATUSES = {
    "new", "under_review", "assigned_to_sales", "sales_review",
    "accepted", "rejected", "in_review", "contacted", "qualified", "closed",
}

# uploads
ALLOWED_RESUME_EXTENSIONS = {"pdf", "doc", "docx"}
MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10 MB
STORAGE_BUCKETS = {"resumes": "resumes", "documents": "documents", "media": "media"}
