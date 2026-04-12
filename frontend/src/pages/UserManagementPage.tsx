import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/useRouter';
import { UserForm } from '../components/admin/UserForm';
import { UserList } from '../components/admin/UserList';
import { adminApi } from '../services/adminApi';
import { UserProfile } from '../services/authApi';
import { logger } from '../utils/logger';

export const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authorization check
  useEffect(() => {
    if (user && user.role !== 'admin') {
      logger.warn('Non-admin user attempted to access User Management page');
      navigate('intelligence');
    }
  }, [user, navigate]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.data?.detail || err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user, loadUsers]);

  if (user?.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">User Management</h2>
        <p className="text-slate-500 mt-2">Create and manage access for your team.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          <h3 className="font-semibold">Error loading data</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <UserForm onUserCreated={loadUsers} />
        </div>
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-500">Loading users...</span>
            </div>
          ) : (
            <UserList users={users} onUserUpdated={loadUsers} />
          )}
        </div>
      </div>
    </div>
  );
};
