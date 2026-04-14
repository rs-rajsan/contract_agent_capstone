import React, { useState, useEffect } from 'react';
import { UserForm } from '../components/admin/UserForm';
import { UserList } from '../components/admin/UserList';
import { SystemConfig } from '../components/admin/SystemConfig';
import { AlertCircle, Users, ShieldCheck, Info, Lock, Database, Save, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { ROLE_HIERARCHY } from '../constants/roles';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { UserProfile } from '../services/authApi';
import { useRouter } from '../lib/useRouter';

export const UserManagementPage: React.FC = () => {
  const { currentPage } = useRouter();
  const [activeTab, setActiveTab] = useState<'manage' | 'add' | 'edit' | 'audit' | 'roles' | 'settings'>(
    currentPage === 'settings' ? 'settings' : 'manage'
  );
  const [activeRoleCategory, setActiveRoleCategory] = useState<'business' | 'legal' | 'technical'>('business');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);

  const { 
    users, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    fetchUsers, 
    deactivate 
  } = useAdminUsers();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditInit = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setActiveTab('edit');
  };

  const renderUsersContent = () => {
    const tabs = [
      { id: 'manage', label: 'Manage Users', icon: Users },
      { id: 'add', label: 'Add User', icon: Info },
      { id: 'edit', label: 'Edit User', icon: Save },
      { id: 'audit', label: 'User Audits', icon: Database },
    ] as const;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter">
            USER <span className="text-blue-600 dark:text-blue-400">PORTAL</span>
          </h1>
        </div>

        {/* Sub-Tabs Navigation - Analytics Style */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-500" : "text-slate-400")} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-1px_6px_rgba(37,99,235,0.3)] animate-in slide-in-from-bottom-1 duration-300" />
                )}
              </button>
             );
          })}
        </div>

        {/* Tab Content Rendering - Force mt-0 to eliminate gap */}
        <div className="mt-0">
          {activeTab === 'manage' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-700 mt-6">
               <UserList 
                 users={users} 
                 isLoading={isLoading} 
                 searchQuery={searchQuery}
                 onSearchChange={setSearchQuery}
                 onEdit={handleEditInit}
                 onDeactivate={deactivate}
               />
            </div>
          )}

          {activeTab === 'add' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 pt-0 mt-0">
              <UserForm onUserCreated={fetchUsers} />
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 pt-0 mt-0">
              {selectedUserForEdit ? (
                <UserForm 
                  mode="edit" 
                  user={selectedUserForEdit} 
                  onUserUpdated={() => {
                    fetchUsers();
                    setActiveTab('manage');
                  }} 
                />
              ) : (
                <div className="p-20 flex flex-col items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <AlertCircle className="w-10 h-10 text-slate-300 mb-4" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Selection</h3>
                  <p className="text-[10px] text-slate-500 text-center mt-2 max-w-sm font-medium uppercase tracking-wide">
                    Please select an agent from the directory to initiate modification.
                  </p>
                  <button 
                    onClick={() => setActiveTab('manage')}
                    className="mt-6 rounded-lg text-[10px] font-black uppercase tracking-widest px-6 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Return to Directory
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-20 flex flex-col items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
              <Database className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">User Activity Intelligence</h3>
              <p className="text-[10px] text-slate-500 text-center mt-2 max-w-sm font-medium uppercase tracking-wide">
                Real-time forensic analysis of user interactions and state mutations. Logic integration in progress.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRolesContent = () => {
    const category = ROLE_HIERARCHY[activeRoleCategory as keyof typeof ROLE_HIERARCHY];
    
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100 uppercase">
            Role <span className="text-indigo-600 dark:text-indigo-400">Management</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            Specialized Capability Tiers & Authorization Graph
          </p>
        </div>

        {/* Category Navigation - Standardized Tab Style */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
          {(Object.entries(ROLE_HIERARCHY) as [string, any][]).map(([key, def]) => {
            const isActive = activeRoleCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveRoleCategory(key as any)}
                className={cn(
                  "relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 uppercase tracking-tight",
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {def.title}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full shadow-[0_-1px_6px_rgba(79,70,229,0.3)] animate-in slide-in-from-bottom-1 duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Category Metadata */}
        <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex items-start gap-6">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-600">
             <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">Category: {category.title}</h3>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed max-w-2xl tracking-wide">
              {category.description}
            </p>
          </div>
        </div>

        {/* Role Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {category.roles.map((role: any) => (
            <div key={role.name} className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl ${role.bg} ${role.color} flex items-center justify-center`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                  {activeRoleCategory} Tier
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{role.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{role.desc}</p>
              
              <div className="space-y-2 pt-6 border-t border-slate-50 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Enabled Capabilities</span>
                <div className="grid grid-cols-2 gap-2">
                  {role.perms.map((p: string) => (
                    <div key={p} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase truncate">
                      <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Access Policy Enforcement</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Role assignments are enforced at the API gateway level. Any unauthorized state transition or data access 
              is logged immediately to the <code>unified_agent_audit.jsonl</code> with a Critical severity flag.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-[calc(100vh-140px)] -m-6 overflow-hidden">
      {/* Admin Persistence Sidebar */}
      <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-200/60 dark:border-slate-800/60 w-64 shrink-0 overflow-hidden animate-in slide-in-from-left duration-500">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 px-3 py-3 opacity-40">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Authority Portal</span>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('manage')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                (activeTab !== 'roles' && activeTab !== 'settings') ? "bg-white dark:bg-slate-800 shadow-md text-blue-600" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              )}
            >
              <Users className={cn("w-4 h-4 transition-transform group-hover:scale-110", (activeTab !== 'roles' && activeTab !== 'settings') ? "text-blue-500" : "text-slate-400")} />
              <span className="text-sm font-bold tracking-tight">User Management</span>
            </button>

            <button 
              onClick={() => setActiveTab('roles')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                activeTab === 'roles' ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              )}
            >
              <ShieldCheck className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'roles' ? "text-indigo-500" : "text-slate-400")} />
              <span className="text-sm font-bold tracking-tight">Role Management</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                activeTab === 'settings' ? "bg-white dark:bg-slate-800 shadow-md text-emerald-600" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              )}
            >
              <Cpu className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'settings' ? "text-emerald-500" : "text-slate-400")} />
              <span className="text-sm font-bold tracking-tight">System Settings</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="p-4 rounded-2xl bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Security Note</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed">
              Role changes require session re-validation to take full effect.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-slate-950 overflow-y-auto">
        {/* Animated Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex-1 p-8 lg:p-12 relative">
          {activeTab === 'roles' && renderRolesContent()}
          {activeTab === 'settings' && <SystemConfig />}
          {activeTab !== 'roles' && activeTab !== 'settings' && renderUsersContent()}
        </div>
      </div>
    </div>
  );
};
