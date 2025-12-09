import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import prescriptionsRouter from './routes/prescriptions';
import branchesRouter from './routes/branches';
import optometristsRouter from './routes/optometrists';
import employeesRouter from './routes/employees';
import campaignsRouter from './routes/campaigns';
import usersRouter from './routes/users';
import auditLogsRouter from './routes/auditLogs';
import reportsRouter from './routes/reports';
import searchRouter from './routes/search';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'optometry-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport is no longer needed for email/password auth
// app.use(passport.initialize());
// app.use(passport.session());

// Development auto-login is handled in the auth middleware

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/auth', authRouter);

// Protected API Routes - require authentication and approval
app.use('/api/customers', requireAuth, customersRouter);
app.use('/api/prescriptions', requireAuth, prescriptionsRouter);
app.use('/api/branches', requireAuth, branchesRouter);
app.use('/api/optometrists', requireAuth, optometristsRouter);
app.use('/api/employees', requireAuth, employeesRouter);
app.use('/api/campaigns', requireAuth, campaignsRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/audit-logs', requireAuth, auditLogsRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/search', requireAuth, searchRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

