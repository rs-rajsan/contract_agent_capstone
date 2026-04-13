import enum
from backend.auth.models import UserRole

class Permission(str, enum.Enum):
    VIEW_CONTRACT = "VIEW_CONTRACT"
    UPLOAD_CONTRACT = "UPLOAD_CONTRACT"
    REVIEW_CONTRACT = "REVIEW_CONTRACT"
    APPROVE_CONTRACT = "APPROVE_CONTRACT"
    MANAGE_USERS = "MANAGE_USERS"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"

ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.admin: {
        Permission.VIEW_CONTRACT,
        Permission.UPLOAD_CONTRACT,
        Permission.REVIEW_CONTRACT,
        Permission.APPROVE_CONTRACT,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.executive: {
        Permission.VIEW_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.ops_lead: {
        Permission.VIEW_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.analyst: {
        Permission.VIEW_CONTRACT,
        Permission.UPLOAD_CONTRACT,
        Permission.REVIEW_CONTRACT,
    },
    UserRole.auditor: {
        Permission.VIEW_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.risk_manager: {
        Permission.VIEW_CONTRACT,
        Permission.REVIEW_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.hitl_supervisor: {
        Permission.VIEW_CONTRACT,
        Permission.REVIEW_CONTRACT,
        Permission.APPROVE_CONTRACT,
    },
    UserRole.ba: {
        Permission.VIEW_CONTRACT,
    },
    UserRole.ai_dev: {
        Permission.VIEW_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.qa: {
        Permission.VIEW_CONTRACT,
    },
}

def has_permission(role: UserRole, perm: Permission) -> bool:
    """Check if a UserRole has a specific Permission"""
    return perm in ROLE_PERMISSIONS.get(role, set())
