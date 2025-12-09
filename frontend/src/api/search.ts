import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SearchIndexCustomer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  idNumber: string;
  phone: string;
  mobile1: string;
  mobile2: string;
  city: string;
  street: string;
}

export interface SearchIndexPrescription {
  id: number;
  prescriptionNumber: number | null;
  date: string;
  type: string;
  healthFund: string;
  price: number | null;
  balance: number | null;
  customerId: number;
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  idNumber: string;
}

export interface SearchIndex {
  customers?: SearchIndexCustomer[];
  prescriptions?: SearchIndexPrescription[];
  timestamp: number;
}

export const searchApi = {
  // Get search index for client-side searching
  getIndex: async (type: 'all' | 'customers' | 'prescriptions' = 'all'): Promise<SearchIndex> => {
    const response = await axios.get(`${API_URL}/api/search/index`, {
      params: { type },
      withCredentials: true,
    });
    return response.data;
  },
};
