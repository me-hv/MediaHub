import { describe, it, expect } from 'vitest';
import { RBACEngine, OrganizationRole, PermissionAction } from '../src/permissions';

describe('RBACEngine', () => {
  it('should allow OWNER to perform all actions', () => {
    const actions: PermissionAction[] = [
      'org.delete',
      'org.transfer_ownership',
      'billing.manage',
      'members.manage',
      'projects.manage',
      'keys.manage',
      'webhooks.manage',
      'media.download',
      'media.read',
    ];

    actions.forEach((action) => {
      expect(RBACEngine.hasPermission('OWNER', action)).toBe(true);
    });
  });

  it('should allow ADMIN to manage members & projects but deny org deletion & billing', () => {
    expect(RBACEngine.hasPermission('ADMIN', 'members.manage')).toBe(true);
    expect(RBACEngine.hasPermission('ADMIN', 'projects.manage')).toBe(true);
    expect(RBACEngine.hasPermission('ADMIN', 'keys.manage')).toBe(true);
    expect(RBACEngine.hasPermission('ADMIN', 'org.delete')).toBe(false);
    expect(RBACEngine.hasPermission('ADMIN', 'billing.manage')).toBe(false);
  });

  it('should allow DEVELOPER to manage keys & webhooks but deny member management', () => {
    expect(RBACEngine.hasPermission('DEVELOPER', 'keys.manage')).toBe(true);
    expect(RBACEngine.hasPermission('DEVELOPER', 'webhooks.manage')).toBe(true);
    expect(RBACEngine.hasPermission('DEVELOPER', 'media.download')).toBe(true);
    expect(RBACEngine.hasPermission('DEVELOPER', 'members.manage')).toBe(false);
  });

  it('should restrict VIEWER to read-only actions', () => {
    expect(RBACEngine.hasPermission('VIEWER', 'media.read')).toBe(true);
    expect(RBACEngine.hasPermission('VIEWER', 'media.download')).toBe(false);
    expect(RBACEngine.hasPermission('VIEWER', 'keys.manage')).toBe(false);
  });
});
