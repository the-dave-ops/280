import { prisma } from '../index';

interface CreateAuditLogParams {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

// Middleware to automatically log API requests
export function auditLogMiddleware(req: any, res: any, next: any) {
  // Store original res.json to intercept responses
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Only log successful operations (status 200-299)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const userId = req.headers['x-user-id']
        ? parseInt(req.headers['x-user-id'] as string)
        : null;

      if (userId) {
        const action = getActionFromMethod(req.method);
        const entityType = getEntityTypeFromPath(req.path);

        createAuditLog({
          userId,
          action,
          entityType,
          entityId: req.params.id ? parseInt(req.params.id) : null,
          description: `${action} ${entityType}`,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
        });
      }
    }

    return originalJson(data);
  };

  next();
}

function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'view';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

function getEntityTypeFromPath(path: string): string {
  // Extract entity type from path like /api/customers -> customers
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

