"""Transactional email notifications.

Sends real email over SMTP when SMTP_HOST is configured (starttls by default;
SSL when SMTP_PORT=465). When unconfigured, emails are skipped with an INFO
log so local dev and tests never fail on email — the in-app notification
(always written alongside) remains the source of truth.

Usage: from routers/services call send_email(...) after writing an in-app
notification (see email/notification fan-out points in hr.py, client.py,
admin.py, project_updates.py).
"""
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("coralswift.email")

_BRAND = (
    "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;"
    "border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
    "<div style=\"background:#0B1426;padding:18px 24px\">"
    "<span style=\"color:#FF6B50;font-weight:800;font-size:18px\">Coral</span>"
    "<span style=\"color:#ffffff;font-weight:800;font-size:18px\">Swift</span></div>"
    "<div style=\"padding:24px;color:#0B1426;font-size:14px;line-height:1.6\">{body}</div>"
    "<div style=\"padding:14px 24px;background:#f8fafc;color:#64748b;font-size:11px\">"
    "CoralSwift Technologies — automated notification</div></div>"
)


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send one email. Returns True when sent, False when skipped/failed."""
    if not to_email or "@" not in to_email:
        return False
    if not smtp_configured():
        logger.info("email skipped (SMTP not configured): to=%s subject=%s", to_email, subject)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name or 'CoralSwift'} <{settings.smtp_from}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body or subject, "plain", "utf-8"))
    msg.attach(MIMEText(_BRAND.format(body=html_body), "html", "utf-8"))

    try:
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as server:
                if settings.smtp_user and settings.smtp_password:
                    server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
                server.ehlo()
                if settings.smtp_port != 25:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo()
                if settings.smtp_user and settings.smtp_password:
                    server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        return True
    except Exception as exc:  # never break an API request on email failure
        logger.warning("email send failed: to=%s subject=%s error=%s", to_email, subject, exc)
        return False


def email_for_profile(sb, profile_id: str) -> str | None:
    """Resolve a profile id → email (service client)."""
    if not profile_id or not sb:
        return None
    try:
        res = sb.table("profiles").select("email").eq("id", profile_id).maybe_single().execute()
        return (res.data or {}).get("email") if res else None
    except Exception:
        return None


def notify_and_email(
    sb,
    profile_id: str | None,
    to_email: str | None,
    title: str,
    body: str,
    category: str = "general",
    link: str | None = None,
) -> None:
    """Write the in-app notification (always) + best-effort email (when configured)."""
    if not profile_id:
        return
    try:
        from app.core.helpers import notify
        notify(profile_id, title, body, category, link)
    except Exception:
        pass
    recipient = to_email or email_for_profile(sb, profile_id)
    if recipient:
        send_email(recipient, title, f"<p style=\"margin:0 0 12px\">{title}</p><p style=\"margin:0;color:#475569\">{body}</p>")
