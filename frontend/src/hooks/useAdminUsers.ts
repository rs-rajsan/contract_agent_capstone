import { useState, useCallback, useMemo } from 'react';
import { adminApi } from '../services/adminApi';
import { UserProfile } from '../services/authApi';
import { logger } from '../utils/logger';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (err: any) {
      const msg = err?.data?.detail || err.message || 'Failed to sync identity vault';
      setError(msg);
      logger.error('Identity sync failure', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filtering logic would go here if we mapped roles to categories in the profile
      // For now, we'll just support search across all fields
      return matchesSearch;
    });
  }, [users, searchQuery]);

  const updateRole = async (username: string, role: string) => {
    try {
      await adminApi.updateUserRole(username, role);
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.data?.detail || err.message };
    }
  };

  const deactivate = async (username: string) => {
    try {
      await adminApi.deactivateUser(username);
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.data?.detail || err.message };
    }
  };

  return {
    users: filteredUsers,
    allUsers: users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    fetchUsers,
    updateRole,
    deactivate
  };
};
