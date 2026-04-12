import React, { useState } from 'react';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { adminApi, CreateUserRequest } from '../../services/adminApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select';

interface UserFormProps {
  onUserCreated: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data: CreateUserRequest = { username, password, role };
      await adminApi.createUser(data);
      setSuccess(`User ${username} created successfully!`);
      setUsername('');
      setPassword('');
      setRole('viewer');
      onUserCreated();
    } catch (err: any) {
      setError(err?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
          {success && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">{success}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter password"
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full border p-2 h-10">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="approver">Approver</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
