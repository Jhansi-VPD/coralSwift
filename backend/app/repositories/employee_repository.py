"""employees table access."""
from app.repositories.base import Repository

EMPLOYEE_IDENTITY_COLUMNS = "id, annual_leave_balance, status, employee_code, profile_id"


class EmployeeRepository(Repository):
    table = "employees"

    def find_by_profile(self, profile_id: str, columns: str = EMPLOYEE_IDENTITY_COLUMNS) -> dict | None:
        return self.fetch_one(columns, profile_id=profile_id)

    def profile_id_of(self, employee_id: str) -> str | None:
        row = self.fetch_one("profile_id", id=employee_id)
        return (row or {}).get("profile_id")

    def owned_project_ids(self, manager_employee_id: str) -> list[str]:
        res = self.sb.table("projects").select("id").eq("manager_id", manager_employee_id).execute()
        return [p["id"] for p in (res.data or [])]
