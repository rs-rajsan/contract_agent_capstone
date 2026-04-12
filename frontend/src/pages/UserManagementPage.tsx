import React, { useEffect, useState, useCallback } from 'react';
import { UserForm } from '../components/admin/UserForm';
import { UserList } from '../components/admin/UserList';
import { adminApi } from '../services/adminApi';
import { UserProfile } from '../services/authApi';
import { AlertCircle, Users, ShieldCheck, Info, Lock, Eye, Database } from 'lucide-react';
import { cn } from '../lib/utils';

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [activeRoleCategory, setActiveRoleCategory] = useState<'business' | 'legal' | 'technical'>('business');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleCategories = {
    business: {
      title: 'Business Tier',
      description: 'Focused on strategic ROI, operational throughput, and high-level enterprise oversight.',
      roles: [
        {
          name: 'Executive Oversight',
          icon: Eye,
          color: 'text-indigo-500',
          bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          desc: 'High-level oversight for the C-Suite and strategic leadership.',
          perms: ['Strategic ROI Dashboards', 'TCV Trend Analysis', 'Aggregate Risk Profiles', 'Read-Only View']
        },
        {
          name: 'Operations Lead',
          icon: Database,
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-500/10',
          desc: 'Management of departmental processing and pipeline priorities.',
          perms: ['Priority Orchestration', 'SLA Monitoring', 'Departmental Approval', 'Volume Forecasting']
        }
      ]
    },
    legal: {
      title: 'Legal & Analysis',
      description: 'The core intelligence layer responsible for contract ingestion, compliance, and auditing.',
      roles: [
        {
          name: 'Analyst',
          icon: Users,
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-500/10',
          desc: 'Primary operator for document processing and intelligence consumption.',
          perms: ['Document Ingestion', 'Report Generation', 'Strategic Insights', 'Chat Access']
        },
        {
          name: 'Auditor',
          icon: ShieldCheck,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          desc: 'Compliance oversight and continuous performance monitoring.',
          perms: ['Immutable Audit Logs', 'System Health Check', 'Analytics Export', 'Performance Review']
        },
        {
          name: 'Risk Manager',
          icon: AlertCircle,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-500/10',
          desc: 'Regulatory policy enforcement and red-flag configuration.',
          perms: ['Compliance Policy Edit', 'Red-Flag Sentinel', 'Risk Baseline Tuning', 'Variance Alerts']
        },
        {
          name: 'HITL Supervisor',
          icon: Lock,
          color: 'text-purple-500',
          bg: 'bg-purple-50 dark:bg-purple-500/10',
          desc: 'Expert-level reasoning validation and quality control.',
          perms: ['Review Queue Access', 'Hallucination Correction', 'Model Logic Validation', 'Final Ingestion Sign-off']
        }
      ]
    },
    technical: {
      title: 'Technical Ops',
      description: 'Infrastructure and AI engineering responsible for model performance and system stability.',
      roles: [
        {
          name: 'Admin',
          icon: ShieldCheck,
          color: 'text-slate-900',
          bg: 'bg-slate-100 dark:bg-slate-800',
          desc: 'Full system orchestration and account management authority.',
          perms: ['User Provisioning', 'Infrastructure Control', 'Full Role Definition', 'Config Access']
        },
        {
          name: 'Business Analyst',
          icon: Info,
          color: 'text-cyan-500',
          bg: 'bg-cyan-50 dark:bg-cyan-500/10',
          desc: 'Mapping business requirements to agentic logic patterns.',
          perms: ['Logic Requirement Definition', 'Pattern Mapping', 'UAT Reporting', 'Feature Specs']
        },
        {
          name: 'AI Developer',
          icon: Database,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50 dark:bg-indigo-600/10',
          desc: 'Agent graph maintenance and model performance tuning.',
          perms: ['Model Selection', 'Prompt Engineering', 'Trace Debugging', 'Webhook Integration']
        },
        {
          name: 'QA Engineer',
          icon: ShieldCheck,
          color: 'text-pink-500',
          bg: 'bg-pink-50 dark:bg-pink-500/10',
          desc: 'Regression testing and AI accuracy verification.',
          perms: ['Benchmark Execution', 'Accuracy Validation', 'Hallucination Tracking', 'Regression Testing']
        }
      ]
    }
  };

  // No authorization check - allowed for all users as requested
  
  const loadUsers = useCallback(async () => {
    if (activeTab !== 'users') return;
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
  }, [activeTab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const renderUsersContent = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100 uppercase">
          User <span className="text-blue-600 dark:text-blue-400">Management</span>
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
          Orchestrate team access and capability roles
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-tight">Access Control Synchronization Failure</h3>
          </div>
          <p className="text-[10px] font-bold mt-1 uppercase opacity-80">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <UserForm onUserCreated={loadUsers} />
          </div>
        </div>
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Identity Vault...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <UserList users={users} onUserUpdated={loadUsers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRolesContent = () => {
    const category = roleCategories[activeRoleCategory];
    
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100 uppercase">
            Capability <span className="text-indigo-600 dark:text-indigo-400">Hierarchy</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Defined permission architecture within the orchestration layer
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800">
          {(['business', 'legal', 'technical'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveRoleCategory(cat)}
              className={cn(
                "relative pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                activeRoleCategory === cat ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {cat}
              {activeRoleCategory === cat && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tier Summary */}
        <div className="p-6 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{category.title} Overview</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {category.description}
          </p>
        </div>

        {/* Role Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {category.roles.map((role) => (
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
                  {role.perms.map(p => (
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
              onClick={() => setActiveTab('users')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                activeTab === 'users' ? "bg-white dark:bg-slate-800 shadow-md text-blue-600" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              )}
            >
              <Users className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'users' ? "text-blue-500" : "text-slate-400")} />
              <span className="text-sm font-bold tracking-tight">User Management</span>
            </button>

            <button 
              onClick={() => setActiveTab('roles')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                activeTab === 'roles' ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              )}
            >
              <ShieldCheck className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'roles' ? "text-indigo-500" : "text-slate-400")} />
              <span className="text-sm font-bold tracking-tight">Role Management</span>
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
          {activeTab === 'users' ? renderUsersContent() : renderRolesContent()}
        </div>
      </div>
    </div>
  );
};
