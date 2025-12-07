import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all audit logs with filters
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      branchId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      limit = '100',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = parseInt(entityId as string);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // If branchId is provided, filter by users in that branch
    if (branchId) {
      const usersInBranch = await prisma.user.findMany({
        where: { branchId: parseInt(branchId as string) },
        select: { id: true },
      });
      where.userId = { in: usersInBranch.map((u) => u.id) };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // If branchId is provided, filter by users in that branch
    if (branchId) {
      const usersInBranch = await prisma.user.findMany({
        where: { branchId: parseInt(branchId as string) },
        select: { id: true },
      });
      where.userId = { in: usersInBranch.map((u) => u.id) };
    }

    const [
      totalActions,
      actionsByType,
      actionsByEntity,
      actionsByUser,
      actionsByDay,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['createdAt'],
        where,
        _count: true,
      }),
    ]);

    // Get user details for actionsByUser
    const usersWithActions = await Promise.all(
      actionsByUser.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          include: { branch: true },
        });
        return {
          user,
          count: item._count,
        };
      })
    );

    res.json({
      totalActions,
      actionsByType: actionsByType.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      actionsByEntity: actionsByEntity.map((item) => ({
        entityType: item.entityType,
        count: item._count,
      })),
      actionsByUser: usersWithActions,
      actionsByDay: actionsByDay.map((item) => ({
        date: item.createdAt,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching audit log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit log statistics' });
  }
});

// Get audit log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.auditLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;

