import { apiClient } from './client';
import type { User } from '../types';

export const usersApi = {
  getAll: async (params?: { branchId?: number; isActive?: boolean; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.role) queryParams.append('role', params.role);

    const response = await apiClient.get<User[]>(`/users?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: {
    email: string;
    password: string;
    name: string;
    picture?: string;
    branchId?: number | null;
    role?: 'admin' | 'employee' | 'manager';
  }) => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: {
    name?: string;
    picture?: string;
    isActive?: boolean;
    isApproved?: boolean;
    branchId?: number | null;
    role?: 'admin' | 'employee' | 'manager';
  }) => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  approve: async (id: number) => {
    const response = await apiClient.post<User>(`/users/${id}/approve`);
    return response.data;
  },

  reject: async (id: number) => {
    const response = await apiClient.post<User>(`/users/${id}/reject`);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<User>(`/users/${id}`);
    return response.data;
  },

  getStatistics: async (id: number, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/users/${id}/statistics?${queryParams.toString()}`);
    return response.data;
  },
};

