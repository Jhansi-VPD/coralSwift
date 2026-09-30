"""Dashboard aggregate — one call for shell bootstrapping (v1 nicety)."""
from fastapi import APIRouter, Depends

from app.core.clients import service_client
from app.core.security import SessionUser, get_session_user
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.auth_service import auth_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/me", summary="Session + employee context + unread notifications")
def my_dashboard(user: SessionUser = Depends(get_session_user)):
    payload = auth_service.me(user)
    sb = service_client()
    employee = None
    unread = 0
    if sb:
        emp = EmployeeRepository(sb).find_by_profile(user.id)
        if emp:
            employee = {"id": emp["id"], "employee_code": emp.get("employee_code"), "status": emp.get("status")}
        unread = len(NotificationRepository(sb).list_for_user(user.id, unread_only=True, limit=100))
    return {**payload, "employee": employee, "unreadNotifications": unread}
