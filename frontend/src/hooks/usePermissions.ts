import { useAuth } from '../contexts/AuthContext';

export enum Permission {
  VIEW_CONTRACT = 'VIEW_CONTRACT',
  UPLOAD_CONTRACT = 'UPLOAD_CONTRACT',
  REVIEW_CONTRACT = 'REVIEW_CONTRACT',
  APPROVE_CONTRACT = 'APPROVE_CONTRACT',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
}

// Keep synced with backend
const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
  admin: new Set([
    Permission.VIEW_CONTRACT,
    Permission.UPLOAD_CONTRACT,
    Permission.REVIEW_CONTRACT,
    Permission.APPROVE_CONTRACT,
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
  ]),
  approver: new Set([
    Permission.VIEW_CONTRACT,
    Permission.REVIEW_CONTRACT,
    Permission.APPROVE_CONTRACT,
    Permission.VIEW_AUDIT_LOGS,
  ]),
  reviewer: new Set([
    Permission.VIEW_CONTRACT,
    Permission.UPLOAD_CONTRACT,
    Permission.REVIEW_CONTRACT,
  ]),
  viewer: new Set([
    Permission.VIEW_CONTRACT,
  ]),
};

export function usePermissions() {
  const { user } = useAuth();
  
  const permissions = user ? ROLE_PERMISSIONS[user.role] : new Set<Permission>();

  return {
    can: (perm: Permission) => permissions?.has(perm) ?? false,
    isAdmin: user?.role === 'admin',
    isReviewer: user?.role === 'reviewer',
    isApprover: user?.role === 'approver',
    isViewer: user?.role === 'viewer',
  };
}
