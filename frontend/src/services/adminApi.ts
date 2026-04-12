import { apiRequest } from './apiClient';
import { UserProfile } from './authApi';
import { logger } from '../utils/logger';

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export const adminApi = {
  listUsers: async (): Promise<UserProfile[]> => {
    try {
      return await apiRequest<UserProfile[]>('/api/admin/users', {
        method: 'GET',
      });
    } catch (error) {
      logger.error('Failed to list users in adminApi', { error });
      throw error;
    }
  },

  createUser: async (data: CreateUserRequest): Promise<UserProfile> => {
    try {
      return await apiRequest<UserProfile>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      logger.error('Failed to create user in adminApi', { error, username: data.username });
      throw error;
    }
  },

  deactivateUser: async (username: string): Promise<UserProfile> => {
    try {
      return await apiRequest<UserProfile>(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      logger.error('Failed to deactivate user in adminApi', { error, username });
      throw error;
    }
  },

  updateUserRole: async (username: string, role: string): Promise<UserProfile> => {
    try {
      return await apiRequest<UserProfile>(`/api/admin/users/${encodeURIComponent(username)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    } catch (error) {
      logger.error('Failed to update user role in adminApi', { error, username, role });
      throw error;
    }
  },

  resetUserPassword: async (username: string, password: string): Promise<UserProfile> => {
    try {
      return await apiRequest<UserProfile>(`/api/admin/users/${encodeURIComponent(username)}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
    } catch (error) {
      logger.error('Failed to reset user password in adminApi', { error, username });
      throw error;
    }
  }
};
