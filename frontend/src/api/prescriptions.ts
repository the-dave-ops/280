import { apiClient } from './client';
import type { Prescription } from '../types';

export const prescriptionsApi = {
  getAll: async (params?: { customerId?: number; type?: string }): Promise<Prescription[]> => {
    const response = await apiClient.get<{ prescriptions: Prescription[] }>('/prescriptions', {
      params,
    });
    return response.data.prescriptions;
  },

  getById: async (id: number): Promise<Prescription> => {
    const response = await apiClient.get<{ prescription: Prescription }>(`/prescriptions/${id}`);
    return response.data.prescription;
  },

  create: async (data: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiClient.post<{ prescription: Prescription }>('/prescriptions', data);
    return response.data.prescription;
  },

  update: async (id: number, data: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiClient.put<{ prescription: Prescription }>(
      `/prescriptions/${id}`,
      data
    );
    return response.data.prescription;
  },

  verifyDelete: async (id: number, password: string): Promise<{ verified: boolean }> => {
    const response = await apiClient.post<{ verified: boolean }>(`/prescriptions/${id}/verify-delete`, {
      password,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/prescriptions/${id}`);
  },

  duplicate: async (id: number): Promise<Prescription> => {
    const response = await apiClient.post<{ prescription: Prescription }>(
      `/prescriptions/${id}/duplicate`
    );
    return response.data.prescription;
  },

  convertToReading: async (id: number): Promise<Prescription> => {
    const response = await apiClient.post<{ prescription: Prescription }>(
      `/prescriptions/${id}/convert-to-reading`
    );
    return response.data.prescription;
  },

  calculatePrice: async (id: number): Promise<Prescription> => {
    const response = await apiClient.post<{ prescription: Prescription }>(
      `/prescriptions/${id}/calculate-price`
    );
    return response.data.prescription;
  },

  generatePdf: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/prescriptions/${id}/generate-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getBranchBalance: async (branchId: number): Promise<number> => {
    const response = await apiClient.get<{ totalBalance: number }>(
      `/prescriptions/branch/${branchId}/balance`
    );
    return response.data.totalBalance;
  },
};

