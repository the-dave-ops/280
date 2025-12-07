import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      picture?: string;
      role: string;
      isActive: boolean;
      isApproved: boolean;
      branchId?: number;
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth in development if SKIP_AUTH is set
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      let mockUser = await prisma.user.findFirst({
        where: { email: adminEmail, isApproved: true },
      });
      
      if (mockUser) {
        req.user = mockUser as Express.User;
        return next();
      }
      
      // If no admin user exists, create one
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      mockUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Development Admin',
          role: 'admin',
          isApproved: true,
          isActive: true,
        },
      });
      
      req.user = mockUser as Express.User;
      return next();
    }

    // Check session
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Your account is pending approval. Please contact an administrator.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Attach full user object to request
    req.user = user as Express.User;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

