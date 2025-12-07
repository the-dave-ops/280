import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { createAuditLog } from '../utils/auditLog';
import { requireAdmin } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();

// Validation schemas
const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  name: z.string(),
  picture: z.string().optional(),
  branchId: z.number().optional().nullable(),
  role: z.enum(['admin', 'employee', 'manager']).default('employee'),
});

const userUpdateSchema = z.object({
  name: z.string().optional(),
  picture: z.string().optional(),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  branchId: z.number().optional().nullable(),
  role: z.enum(['admin', 'employee', 'manager']).optional(),
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const { branchId, isActive, role } = req.query;

    const where: any = {};
    if (branchId) where.branchId = parseInt(branchId as string);
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        branch: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const data = userCreateSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        picture: data.picture,
        branchId: data.branchId,
        role: data.role || 'employee',
        isActive: true,
        isApproved: true, // Auto-approve admin-created users
        lastLoginAt: new Date(),
      },
      include: {
        branch: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      description: `User created: ${user.name}`,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = userUpdateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: {
        branch: true,
      },
    });

    await createAuditLog({
      userId: parseInt(req.headers['x-user-id'] as string) || user.id,
      action: 'update',
      entityType: 'user',
      entityId: user.id,
      description: `User updated: ${user.name}`,
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (soft delete - set isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        branch: true,
      },
    });

    await createAuditLog({
      userId: parseInt(req.headers['x-user-id'] as string) || user.id,
      action: 'delete',
      entityType: 'user',
      entityId: user.id,
      description: `User deactivated: ${user.name}`,
    });

    res.json(user);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Approve user (admin only)
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true, isActive: true },
      include: { branch: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'approve',
      entityType: 'user',
      entityId: userId,
      description: `User ${user.name} approved by admin`,
    });

    res.json(user);
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject/Deactivate user (admin only)
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: false, isActive: false },
      include: { branch: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'reject',
      entityType: 'user',
      entityId: userId,
      description: `User ${user.name} rejected by admin`,
    });

    res.json(user);
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Get user statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { userId: parseInt(id) };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const totalActions = await prisma.auditLog.count({ where });
    const actionsByType = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    const actionsByEntity = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
    });

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
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;

