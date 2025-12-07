import { apiClient } from './client';
import type { AuditLog } from '../types';

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogStatistics {
  totalActions: number;
  actionsByType: { action: string; count: number }[];
  actionsByEntity: { entityType: string; count: number }[];
  actionsByUser: { user: any; count: number }[];
  actionsByDay: { date: Date; count: number }[];
}

export const auditLogsApi = {
  getAll: async (params?: {
    userId?: number;
    branchId?: number;
    action?: string;
    entityType?: string;
    entityId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entityType) queryParams.append('entityType', params.entityType);
    if (params?.entityId) queryParams.append('entityId', params.entityId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<AuditLogsResponse>(`/audit-logs?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<AuditLog>(`/audit-logs/${id}`);
    return response.data;
  },

  getStatistics: async (params?: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get<AuditLogStatistics>(
      `/audit-logs/statistics?${queryParams.toString()}`
    );
    return response.data;
  },
};

