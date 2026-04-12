import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select';
import { adminApi } from '../../services/adminApi';
import { UserProfile } from '../../services/authApi';

interface UserListProps {
  users: UserProfile[];
  onUserUpdated: () => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onUserUpdated }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleRoleChange = async (username: string, newRole: string) => {
    setUpdatingUser(username);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.updateUserRole(username, newRole);
      setSuccess(`Role updated for ${username}`);
      onUserUpdated();
    } catch (err: any) {
      setError(err?.data?.detail || err.message || `Failed to update role for ${username}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeactivate = async (username: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${username}?`)) return;
    
    setUpdatingUser(username);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.deactivateUser(username);
      setSuccess(`User ${username} deactivated successfully`);
      onUserUpdated();
    } catch (err: any) {
      setError(err?.data?.detail || err.message || `Failed to deactivate ${username}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleResetPassword = async (username: string) => {
    if (!newPassword) return;
    
    setUpdatingUser(username);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.resetUserPassword(username, newPassword);
      setSuccess(`Password reset for ${username} successfully`);
      setResettingPasswordFor(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err?.data?.detail || err.message || `Failed to reset password for ${username}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Existing Users</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
        {success && <div className="p-3 mb-4 text-sm text-green-600 bg-green-50 rounded-md">{success}</div>}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3 border-b border-slate-200 font-medium w-auto">Username</th>
                <th className="p-3 border-b border-slate-200 font-medium w-24">Status</th>
                <th className="p-3 border-b border-slate-200 font-medium w-40">Role</th>
                <th className="p-3 border-b border-slate-200 font-medium text-right w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex w-32 items-center">
                      <Select 
                        value={u.role} 
                        onValueChange={(val) => handleRoleChange(u.username, val)}
                        disabled={!u.is_active || updatingUser === u.username}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="approver">Approver</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap w-64">
                    <div className="flex items-center justify-end gap-2 flex-nowrap">
                      {resettingPasswordFor === u.username ? (
                        <div className="flex items-center gap-2 flex-nowrap">
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-8 w-32 rounded-md border p-2 text-xs flex-shrink-0"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleResetPassword(u.username)}
                            disabled={!newPassword || updatingUser === u.username}
                            className="flex-shrink-0"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResettingPasswordFor(null);
                              setNewPassword('');
                            }}
                            className="flex-shrink-0"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!u.is_active || updatingUser === u.username}
                            onClick={() => setResettingPasswordFor(u.username)}
                            className="flex-shrink-0"
                          >
                            Reset Pwd
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!u.is_active || updatingUser === u.username || u.username === 'admin'}
                            onClick={() => handleDeactivate(u.username)}
                            className="flex-shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
