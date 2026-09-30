"""Employee-context helper shared by employee/manager workflows."""
from fastapi import HTTPException
from supabase import Client

from app.repositories.employee_repository import EmployeeRepository


def get_my_employee(sb: Client, profile_id: str) -> dict | None:
    repo = EmployeeRepository(sb)
    return repo.find_by_profile(profile_id)


def require_my_employee(sb: Client, profile_id: str, detail: str = "No employee record; contact HR") -> dict:
    me = get_my_employee(sb, profile_id)
    if not me:
        raise HTTPException(status_code=400, detail=detail)
    return me


def get_my_employee_id(sb: Client, profile_id: str) -> str | None:
    me = get_my_employee(sb, profile_id)
    return me["id"] if me else None
