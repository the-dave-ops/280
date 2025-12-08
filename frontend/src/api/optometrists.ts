import { apiClient } from './client';
import type { Optometrist } from '../types';

export const optometristsApi = {
  getAll: async (): Promise<Optometrist[]> => {
    const response = await apiClient.get('/optometrists');
    return response.data.optometrists || [];
  },

  getById: async (id: number): Promise<Optometrist> => {
    const response = await apiClient.get(`/optometrists/${id}`);
    return response.data;
  },

  create: async (data: Partial<Optometrist>): Promise<Optometrist> => {
    const response = await apiClient.post('/optometrists', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Optometrist>): Promise<Optometrist> => {
    const response = await apiClient.put(`/optometrists/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/optometrists/${id}`);
  },
};
