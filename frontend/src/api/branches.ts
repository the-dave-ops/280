import { apiClient } from './client';
import type { Branch } from '../types';

export const branchesApi = {
  getAll: async (): Promise<Branch[]> => {
    const response = await apiClient.get<{ branches: Branch[] }>('/branches');
    return response.data.branches;
  },

  getById: async (id: number): Promise<Branch> => {
    const response = await apiClient.get<{ branch: Branch }>(`/branches/${id}`);
    return response.data.branch;
  },

  create: async (data: Partial<Branch>): Promise<Branch> => {
    const response = await apiClient.post<{ branch: Branch }>('/branches', data);
    return response.data.branch;
  },

  update: async (id: number, data: Partial<Branch>): Promise<Branch> => {
    const response = await apiClient.put<{ branch: Branch }>(`/branches/${id}`, data);
    return response.data.branch;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/branches/${id}`);
  },
};

