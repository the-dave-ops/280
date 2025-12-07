import { apiClient } from './client';

export interface RevenueByBranch {
  branchName: string;
  revenue: number;
  count: number;
}

export interface CountByBranch {
  branchName: string;
  count: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  branchId?: number;
  optometristId?: number;
}

export const reportsApi = {
  getRevenueByBranch: async (filters?: ReportFilters): Promise<RevenueByBranch[]> => {
    const response = await apiClient.get<{ data: RevenueByBranch[] }>('/reports/revenue/by-branch', {
      params: filters,
    });
    return response.data.data;
  },

  getPrescriptionsByBranch: async (filters?: ReportFilters): Promise<CountByBranch[]> => {
    const response = await apiClient.get<{ data: CountByBranch[] }>('/reports/prescriptions/by-branch', {
      params: filters,
    });
    return response.data.data;
  },

  getCustomersByBranch: async (filters?: ReportFilters): Promise<CountByBranch[]> => {
    const response = await apiClient.get<{ data: CountByBranch[] }>('/reports/customers/by-branch', {
      params: filters,
    });
    return response.data.data;
  },

  getEmployeesByBranch: async (filters?: ReportFilters): Promise<CountByBranch[]> => {
    const response = await apiClient.get<{ data: CountByBranch[] }>('/reports/employees/by-branch', {
      params: filters,
    });
    return response.data.data;
  },

  generatePDF: async (reportType: string, filters: ReportFilters): Promise<Blob> => {
    const response = await apiClient.post(
      '/reports/generate-pdf',
      { reportType, ...filters },
      { responseType: 'blob' }
    );
    return response.data;
  },
};

