import { prisma } from '../config/prisma';
import { SlugUtils } from '@mediahub/organizations';
import { ProjectData } from '@mediahub/types';
import { logger } from '../utils/logger';

export class ProjectService {
  static async createProject(organizationId: string, name: string, environment = 'PRODUCTION'): Promise<ProjectData> {
    const slug = SlugUtils.generateSlug(name);

    try {
      const project = await prisma.project.create({
        data: {
          organizationId,
          name,
          slug,
          environment: environment as any,
          status: 'ACTIVE',
        },
      });

      logger.info({ organizationId, projectId: project.id }, 'Created Project');

      return {
        id: project.id,
        organizationId: project.organizationId,
        name: project.name,
        slug: project.slug,
        environment: project.environment,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      };
    } catch (err: any) {
      logger.error({ error: err.message, organizationId }, 'Failed to create project');
      throw err;
    }
  }

  static async listProjects(organizationId: string): Promise<ProjectData[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      return projects.map((p) => ({
        id: p.id,
        organizationId: p.organizationId,
        name: p.name,
        slug: p.slug,
        environment: p.environment,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }
}
