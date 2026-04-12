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
    UserRole.approver: {
        Permission.VIEW_CONTRACT,
        Permission.REVIEW_CONTRACT,
        Permission.APPROVE_CONTRACT,
        Permission.VIEW_AUDIT_LOGS,
    },
    UserRole.reviewer: {
        Permission.VIEW_CONTRACT,
        Permission.UPLOAD_CONTRACT,
        Permission.REVIEW_CONTRACT,
    },
    UserRole.viewer: {
        Permission.VIEW_CONTRACT,
    },
}

def has_permission(role: UserRole, perm: Permission) -> bool:
    """Check if a UserRole has a specific Permission"""
    return perm in ROLE_PERMISSIONS.get(role, set())
