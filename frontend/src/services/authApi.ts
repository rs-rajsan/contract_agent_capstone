import { apiRequest, tokenStore } from './apiClient';

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  status: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone_number?: string;
  job_title?: string;
  department?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  last_login?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    return apiRequest<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  
  me: async (): Promise<UserProfile> => {
    return apiRequest<UserProfile>('/api/auth/me', {
      method: 'GET',
    });
  },

  logout: async (): Promise<void> => {
    try {
      // Optional: Inform the backend, though we invalidate client-side mostly
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors on logout
    } finally {
      tokenStore.clear();
    }
  }
};
