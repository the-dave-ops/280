import axios from 'axios';
import type { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create a separate axios instance for auth routes (not under /api)
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'employee' | 'manager';
  branchId?: number;
}

export const authApi = {
  // Login with email/password
  login: async (credentials: LoginCredentials): Promise<{ user: User }> => {
    const response = await authClient.post<{ user: User }>('/auth/login', credentials);
    return response.data;
  },

  // Register new user (admin only)
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const response = await authClient.post<{ user: User }>('/auth/register', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await authClient.get<User>('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await authClient.post('/auth/logout');
  },
};

