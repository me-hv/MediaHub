export type OrganizationRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export type PermissionAction =
  | 'org.delete'
  | 'org.transfer_ownership'
  | 'billing.manage'
  | 'members.manage'
  | 'projects.manage'
  | 'keys.manage'
  | 'webhooks.manage'
  | 'media.download'
  | 'media.read';

const roleHierarchy: Record<OrganizationRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

const permissionMatrix: Record<PermissionAction, OrganizationRole> = {
  'org.delete': 'OWNER',
  'org.transfer_ownership': 'OWNER',
  'billing.manage': 'OWNER',
  'members.manage': 'ADMIN',
  'projects.manage': 'ADMIN',
  'keys.manage': 'DEVELOPER',
  'webhooks.manage': 'DEVELOPER',
  'media.download': 'DEVELOPER',
  'media.read': 'VIEWER',
};

export class RBACEngine {
  static hasPermission(userRole: OrganizationRole, action: PermissionAction): boolean {
    const requiredRole = permissionMatrix[action];
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  static isHigherOrEqual(roleA: OrganizationRole, roleB: OrganizationRole): boolean {
    return roleHierarchy[roleA] >= roleHierarchy[roleB];
  }
}
