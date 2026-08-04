import { prisma } from '../config/prisma';
import { SlugUtils } from '@mediahub/organizations';
import { OrganizationData, MembershipData, OrganizationRoleData } from '@mediahub/types';
import { logger } from '../utils/logger';

export class OrganizationService {
  static async createOrganization(userId: string, name: string): Promise<OrganizationData> {
    const slug = SlugUtils.generateSlug(name);

    try {
      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          subscription: {
            create: {
              plan: 'FREE',
            },
          },
          memberships: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
          projects: {
            create: {
              name: 'Default Project',
              slug: 'default',
              environment: 'PRODUCTION',
            },
          },
        },
        include: {
          subscription: true,
          memberships: true,
          projects: true,
        },
      });

      logger.info({ userId, orgId: org.id, slug: org.slug }, 'Created Organization');

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: 'OWNER',
        plan: org.subscription?.plan || 'FREE',
        membersCount: org.memberships.length,
        projectsCount: org.projects.length,
        createdAt: org.createdAt.toISOString(),
      };
    } catch (err: any) {
      logger.error({ error: err.message, userId }, 'Failed to create Organization');
      throw err;
    }
  }

  static async listUserOrganizations(userId: string): Promise<OrganizationData[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { userId, organization: { deletedAt: null } },
        include: {
          organization: {
            include: {
              subscription: true,
              memberships: true,
              projects: true,
            },
          },
        },
      });

      return memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role as OrganizationRoleData,
        plan: m.organization.subscription?.plan || 'FREE',
        membersCount: m.organization.memberships.length,
        projectsCount: m.organization.projects.length,
        createdAt: m.organization.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  static async getOrganizationMembers(orgId: string): Promise<MembershipData[]> {
    try {
      const members = await prisma.membership.findMany({
        where: { organizationId: orgId },
        include: { user: true },
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        displayName: m.user.displayName || undefined,
        role: m.role as OrganizationRoleData,
        createdAt: m.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  static async inviteMember(orgId: string, invitedById: string, email: string, role: OrganizationRoleData = 'DEVELOPER') {
    const tokenPrefix = `inv_${Date.now().toString(36)}`;
    const tokenHash = `hash_${tokenPrefix}_${Math.random()}`;

    return await prisma.invitation.create({
      data: {
        organizationId: orgId,
        email: email.toLowerCase().trim(),
        role,
        tokenPrefix,
        tokenHash,
        invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
}
