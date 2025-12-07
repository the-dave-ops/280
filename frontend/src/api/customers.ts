import { apiClient } from './client';
import type { Customer } from '../types';

export const customersApi = {
  getAll: async (params?: { limit?: number; offset?: number; branchId?: number }): Promise<Customer[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.branchId) queryParams.append('branchId', params.branchId.toString());

    const response = await apiClient.get<{ customers: Customer[] }>(
      `/customers?${queryParams.toString()}`
    );
    return response.data.customers;
  },

  search: async (query: string): Promise<Customer[]> => {
    const response = await apiClient.get<{ customers: Customer[] }>('/customers/search', {
      params: { q: query },
    });
    return response.data.customers;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<{ customer: Customer }>(`/customers/${id}`);
    return response.data.customer;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post<{ customer: Customer }>('/customers', data);
    return response.data.customer;
  },

  update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put<{ customer: Customer }>(`/customers/${id}`, data);
    return response.data.customer;
  },

  delete: async (id: number, password: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`, { data: { password } });
  },

  getPrescriptions: async (customerId: number) => {
    const response = await apiClient.get<{ prescriptions: any[] }>(
      `/customers/${customerId}/prescriptions`
    );
    return response.data.prescriptions;
  },
};

