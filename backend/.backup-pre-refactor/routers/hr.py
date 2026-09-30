"""HR router — users, employees, departments, leave approvals, attendance."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, notify, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/api/hr", tags=["hr"])

ROLES = ("admin", "hr", "sales", "manager", "employee", "client")


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", summary="List all user accounts")
def list_users(user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = sb.table("profiles").select("id, email, full_name, role, phone, is_active, created_at").order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    fullName: str
    role: str
    phone: str | None = None


@router.post("/users", status_code=201, summary="Provision a user with a role")
def create_user(body: CreateUserRequest, request: Request, user: SessionUser = Depends(require_role("hr"))):
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(ROLES)}")
    if body.role == "admin" and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only an admin can provision another admin account")

    sb = _sb()
    auth = sb.auth.admin
    try:
        created = auth.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {"full_name": body.fullName, "role": body.role},
        })
        user_id = created.user.id
        sb.table("profiles").upsert({
            "id": user_id, "email": body.email, "full_name": body.fullName,
            "role": body.role, "phone": body.phone,
        }, on_conflict="id").execute()
    except Exception as e:
        raise_db_error(e, "User provisioning failed")

    audit("CREATE_USER", "profiles", user_id, user, {"email": body.email, "role": body.role}, client_ip(request))
    return {"success": True, "user": {"id": user_id, "email": body.email}}


class UpdateUserRequest(BaseModel):
    id: str
    isActive: bool | None = None
    role: str | None = None
    fullName: str | None = None
    phone: str | None = None


@router.patch("/users", summary="Update a user (deactivate / role / profile)")
def update_user(body: UpdateUserRequest, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    updates: dict = {}
    if body.isActive is not None:
        updates["is_active"] = body.isActive
    if body.fullName:
        updates["full_name"] = body.fullName.strip()
    if body.phone is not None:
        updates["phone"] = body.phone
    if body.role:
        if body.role not in ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        if body.role == "admin" and not user.is_admin:
            raise HTTPException(status_code=403, detail="Only an admin can grant the admin role")
        updates["role"] = body.role
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    try:
        res = sb.table("profiles").update(updates).eq("id", body.id).select("id, email, role, is_active").execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    audit("UPDATE_USER", "profiles", body.id, user, updates, client_ip(request))
    return {"success": True, "user": res.data[0]}


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

EMPLOYEE_SELECT = (
    "id, employee_code, designation, employment_type, work_model, date_of_joining, status, "
    "annual_leave_balance, salary_band, "
    "profile:profiles!employees_profile_id_fkey (id, email, full_name, phone, role, is_active), "
    "department:departments (id, name), "
    "manager:employees!employees_manager_id_fkey (id, employee_code, profile:profiles (full_name, email))"
)


@router.get("/employees", summary="Employee directory")
def list_employees(department: str | None = None, status: str | None = None, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        query = sb.table("employees").select(EMPLOYEE_SELECT)
        if department:
            query = query.eq("department_id", department)
        if status:
            query = query.eq("status", status)
        res = query.order("employee_code").execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class CreateEmployeeRequest(BaseModel):
    fullName: str
    employeeCode: str
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    createAccount: bool = True
    designation: str | None = None
    departmentId: str | None = None
    managerId: str | None = None
    employmentType: str = "Full-time"
    workModel: str = "Hybrid"
    dateOfJoining: str | None = None
    annualLeaveBalance: int = 20
    phone: str | None = None


@router.post("/employees", status_code=201, summary="Onboard an employee (+ optional account)")
def create_employee(body: CreateEmployeeRequest, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    profile_id: str | None = None

    if body.createAccount and body.email and body.password:
        try:
            created = sb.auth.admin.create_user({
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {"full_name": body.fullName, "role": "employee"},
            })
            profile_id = created.user.id
            sb.table("profiles").upsert({
                "id": profile_id, "email": body.email, "full_name": body.fullName,
                "role": "employee", "phone": body.phone,
            }, on_conflict="id").execute()
        except Exception as e:
            raise_db_error(e, "Account creation failed")

    try:
        res = sb.table("employees").insert({
            "profile_id": profile_id,
            "employee_code": body.employeeCode.strip(),
            "designation": (body.designation or "").strip(),
            "department_id": body.departmentId or None,
            "manager_id": body.managerId or None,
            "employment_type": body.employmentType,
            "work_model": body.workModel,
            "date_of_joining": body.dateOfJoining or dt.date.today().isoformat(),
            "annual_leave_balance": body.annualLeaveBalance,
            "status": "active" if profile_id else "onboarding",
        }).select(EMPLOYEE_SELECT).execute()
    except Exception as e:
        raise_db_error(e, "Failed to create employee")

    row = res.data[0]
    audit("CREATE_EMPLOYEE", "employees", row["id"], user, {"employee_code": body.employeeCode, "name": body.fullName}, client_ip(request))
    if profile_id:
        notify(profile_id, "Welcome to CoralSwift", "Your employee account has been created.", "general", "/employee")
    return row


class UpdateEmployeeRequest(BaseModel):
    id: str
    designation: str | None = None
    departmentId: str | None = None
    managerId: str | None = None
    employmentType: str | None = None
    workModel: str | None = None
    dateOfJoining: str | None = None
    status: str | None = None
    annualLeaveBalance: int | None = None
    salaryBand: str | None = None


@router.patch("/employees", summary="Update an employee record")
def update_employee(body: UpdateEmployeeRequest, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    field_map = {
        "designation": "designation", "departmentId": "department_id", "managerId": "manager_id",
        "employmentType": "employment_type", "workModel": "work_model", "dateOfJoining": "date_of_joining",
        "status": "status", "annualLeaveBalance": "annual_leave_balance", "salaryBand": "salary_band",
    }
    updates = {col: getattr(body, key) for key, col in field_map.items() if getattr(body, key) is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    try:
        res = sb.table("employees").update(updates).eq("id", body.id).select(EMPLOYEE_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    audit("UPDATE_EMPLOYEE", "employees", body.id, user, updates, client_ip(request))
    return res.data[0]


@router.delete("/employees/{employee_id}", summary="Mark employee as exited (soft)")
def exit_employee(employee_id: str, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        sb.table("employees").update({"status": "exited"}).eq("id", employee_id).execute()
    except Exception as e:
        raise_db_error(e)
    audit("EXIT_EMPLOYEE", "employees", employee_id, user, ip=client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------

@router.get("/departments", summary="Departments with headcount")
def list_departments(user: SessionUser = Depends(require_role("hr", "sales", "manager", "employee"))):
    sb = _sb()
    try:
        res = (
            sb.table("departments")
            .select("id, name, created_at, head:profiles!departments_head_of_department_fkey (full_name, email), employees:employees (count)")
            .order("name").execute()
        )
    except Exception as e:
        raise_db_error(e)
    return [
        {
            "id": d["id"], "name": d["name"], "head": d.get("head"),
            "employee_count": (d.get("employees") or [{}])[0].get("count", 0) if d.get("employees") else 0,
            "created_at": d["created_at"],
        }
        for d in (res.data or [])
    ]


class DepartmentRequest(BaseModel):
    name: str
    headOfDepartment: str | None = None


@router.post("/departments", status_code=201, summary="Create a department")
def create_department(body: DepartmentRequest, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = sb.table("departments").insert({"name": body.name.strip(), "head_of_department": body.headOfDepartment}).select("*").execute()
    except Exception as e:
        raise_db_error(e, "Create department failed")
    audit("CREATE_DEPARTMENT", "departments", res.data[0]["id"], user, {"name": body.name})
    return res.data[0]


@router.patch("/departments", summary="Update a department")
def update_department(body: DepartmentRequest, id: str, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    updates: dict = {"name": body.name.strip()}
    if body.headOfDepartment is not None:
        updates["head_of_department"] = body.headOfDepartment or None
    try:
        res = sb.table("departments").update(updates).eq("id", id).select("*").execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Department not found")
    audit("UPDATE_DEPARTMENT", "departments", id, user, updates)
    return res.data[0]


@router.delete("/departments/{dept_id}", summary="Delete a department (guarded)")
def delete_department(dept_id: str, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        count = len(sb.table("employees").select("id").eq("department_id", dept_id).execute().data or [])
    except Exception as e:
        raise_db_error(e)
    if count > 0:
        raise HTTPException(status_code=409, detail=f"Cannot delete: {count} employee(s) still assigned to this department")
    try:
        sb.table("departments").delete().eq("id", dept_id).execute()
    except Exception as e:
        raise_db_error(e)
    audit("DELETE_DEPARTMENT", "departments", dept_id, user, ip=client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Leave & attendance
# ---------------------------------------------------------------------------

LEAVE_SELECT = (
    "id, leave_type, start_date, end_date, reason, status, review_notes, reviewed_at, created_at, "
    # two FKs to employees (employee_id, reviewer_id) — hints are required
    "employee:employees!leave_requests_employee_id_fkey (id, employee_code, annual_leave_balance, profile:profiles (full_name, email)), "
    "reviewer:employees!leave_requests_reviewer_id_fkey (id, profile:profiles (full_name))"
)


@router.get("/leave", summary="All leave requests")
def list_leave(status: str | None = None, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        query = sb.table("leave_requests").select(LEAVE_SELECT)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class LeaveDecision(BaseModel):
    id: str
    decision: str  # approved | rejected
    notes: str | None = None


def _business_days(start: str, end: str) -> int:
    s, e = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
    days, cur = 0, s
    while cur <= e:
        if cur.weekday() < 5:
            days += 1
        cur += dt.timedelta(days=1)
    return days


def _my_employee_id(sb: Client, profile_id: str) -> str | None:
    res = sb.table("employees").select("id").eq("profile_id", profile_id).maybe_single().execute()
    return (res.data or {}).get("id")


@router.patch("/leave", summary="Approve / reject leave (deducts annual balance)")
def decide_leave(body: LeaveDecision, request: Request, user: SessionUser = Depends(require_role("hr"))):
    if body.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be approved or rejected")
    sb = _sb()
    try:
        row = sb.table("leave_requests").select("id,employee_id,leave_type,start_date,end_date,status").eq("id", body.id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    req = row.data if row else None
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if req["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Leave request is already {req['status']}")

    reviewer_id = _my_employee_id(sb, user.id)
    try:
        sb.table("leave_requests").update({
            "status": body.decision,
            "reviewer_id": reviewer_id,
            "review_notes": body.notes,
            "reviewed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }).eq("id", body.id).execute()
    except Exception as e:
        raise_db_error(e, "Failed to update leave")

    new_balance = None
    if body.decision == "approved" and req["leave_type"] == "annual":
        try:
            emp = sb.table("employees").select("id, annual_leave_balance, profile_id").eq("id", req["employee_id"]).maybe_single().execute()
            if emp.data:
                days = _business_days(req["start_date"], req["end_date"])
                new_balance = max(0, int(emp.data.get("annual_leave_balance") or 0) - days)
                sb.table("employees").update({"annual_leave_balance": new_balance}).eq("id", emp.data["id"]).execute()
                if emp.data.get("profile_id"):
                    notify(
                        emp.data["profile_id"], f"Leave {body.decision}",
                        f"Your leave ({req['start_date']} → {req['end_date']}) was {body.decision}. Remaining balance: {new_balance} days.",
                        "leave", "/employee/leave",
                    )
        except Exception as e:
            raise_db_error(e, "Failed to adjust balance")

    audit(f"LEAVE_{body.decision.upper()}", "leave_requests", body.id, user, {"employee_id": req["employee_id"]}, client_ip(request))
    return {"success": True, "decision": body.decision, "newBalance": new_balance}


ATTENDANCE_SELECT = (
    "id, work_date, check_in, check_out, status, notes, "
    "employee:employees (id, employee_code, profile:profiles (full_name, email))"
)


@router.get("/attendance", summary="Org-wide attendance")
def list_attendance(
    from_: str | None = None,
    to: str | None = None,
    employee: str | None = None,
    user: SessionUser = Depends(require_role("hr")),
):
    sb = _sb()
    try:
        query = sb.table("attendance").select(ATTENDANCE_SELECT).order("work_date", desc=True).limit(500)
        if from_:
            query = query.gte("work_date", from_)
        if to:
            query = query.lte("work_date", to)
        if employee:
            query = query.eq("employee_id", employee)
        res = query.execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []
