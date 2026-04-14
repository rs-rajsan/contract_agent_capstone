import React, { useMemo } from 'react';
import { Card, CardContent } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { UserProfile } from '../../services/authApi';
import { Search, Edit3, UserMinus, Shield, Filter, UserCheck, ShieldAlert, Activity } from 'lucide-react';
import { getAllRoles } from '../../constants/roles';
import { cn } from '../../lib/utils';

interface UserListProps {
  users: UserProfile[];
  isLoading?: boolean;
  onEdit: (user: UserProfile) => void;
  onDeactivate: (username: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ 
  users, 
  isLoading, 
  onEdit, 
  onDeactivate,
  searchQuery,
  onSearchChange
}) => {
  const allRolesList = useMemo(() => getAllRoles(), []);

  const getRoleBadge = (roleId: string) => {
    const roleDef = allRolesList.find(r => r.id === roleId);
    if (!roleDef) return { label: roleId, color: 'text-slate-500', bg: 'bg-slate-100', icon: Shield };
    return {
      label: roleDef.name,
      color: roleDef.color,
      bg: roleDef.bg,
      icon: roleDef.icon
    };
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by username or role..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">Filters</span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Identity Agent</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Professional Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Security Tier</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Orchestration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const badge = getRoleBadge(user.role);
                  const Icon = badge.icon;
                  
                  return (
                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase">
                            {user.first_name?.[0] || user.username.slice(0, 1)}{user.last_name?.[0] || user.username.slice(1, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            {user.job_title || 'N/A'}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            {user.email || 'NO_EMAIL@SECURE.INTERNAL'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight", badge.bg, badge.color)}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
                            user.status === 'active' 
                              ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" 
                              : user.status === 'inactive'
                                ? "bg-amber-500/5 text-amber-600 border-amber-500/20"
                                : "bg-red-500/5 text-red-600 border-red-500/20"
                          )}>
                            {user.status === 'active' ? <UserCheck className="w-3 h-3" /> : user.status === 'inactive' ? <Activity className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">{user.status || 'Active'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEdit(user)}
                            className="h-8 px-3 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-2" />
                            <span className="text-[10px] font-black uppercase">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={user.status !== 'active' || user.username === 'admin'}
                            onClick={() => onDeactivate(user.username)}
                            className="h-8 px-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30"
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-2" />
                            <span className="text-[10px] font-black uppercase">Revoke</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !isLoading && (
            <div className="p-20 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
              <Search className="w-10 h-10 text-slate-200 mb-4" />
              <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No agents found matching criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
