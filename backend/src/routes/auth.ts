import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { requireAuth } from '../middleware/auth';
import { createAuditLog } from '../utils/auditLog';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();

// Login schema
const loginSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(1, 'סיסמה נדרשת'),
});

// Register schema (for creating new users)
const registerSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  name: z.string().min(1, 'שם נדרש'),
  role: z.enum(['admin', 'employee', 'manager']).optional(),
  branchId: z.number().optional(),
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    // Check if user has password (new auth system)
    if (!user.password) {
      return res.status(401).json({ error: 'משתמש זה לא מוגדר עם סיסמה. אנא פנה למנהל המערכת.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'החשבון מושבת. אנא פנה למנהל המערכת.' });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({ error: 'החשבון ממתין לאישור. אנא פנה למנהל המערכת.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    (req.session as any).userId = user.id;

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      description: 'User logged in with email/password',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה בהתחברות' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    // In development with SKIP_AUTH, create/get dev user
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      let devUser = await prisma.user.findFirst({
        where: { email: adminEmail },
        include: { branch: true },
      });

      if (!devUser) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        devUser = await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Development Admin',
            role: 'admin',
            isApproved: true,
            isActive: true,
          },
          include: { branch: true },
        });
      }

      // Set session
      (req.session as any).userId = devUser.id;
      const { password: _, ...userWithoutPassword } = devUser;
      return res.json(userWithoutPassword);
    }

    // Check session
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    await createAuditLog({
      userId: req.user!.id,
      action: 'logout',
      entityType: 'user',
      entityId: req.user!.id,
      description: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Register new user (admin only)
router.post('/register', requireAuth, async (req: Request, res: Response) => {
  try {
    // Only admins can create users
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'רק מנהל יכול ליצור משתמשים חדשים' });
    }

    const { email, password, name, role, branchId } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'employee',
        branchId: branchId || null,
        isActive: true,
        isApproved: true, // Auto-approve users created by admin
      },
      include: { branch: true },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'create',
      entityType: 'user',
      entityId: newUser.id,
      description: `Created new user: ${newUser.email}`,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
