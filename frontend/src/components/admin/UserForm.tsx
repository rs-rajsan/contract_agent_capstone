import React, { useState, useEffect } from 'react';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { adminApi, CreateUserRequest } from '../../services/adminApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select';
import { UserProfile } from '../../services/authApi';
import { ROLE_HIERARCHY } from '../../constants/roles';
import { UserPlus, Save, AlertCircle, CheckCircle2, Shield, User, Mail, Phone, Briefcase, Building, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UserFormProps {
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  mode?: 'create' | 'edit';
  user?: UserProfile | null;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  onUserCreated, 
  onUserUpdated, 
  mode = 'create', 
  user 
}) => {
  // Credentials
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'analyst');
  const [status, setStatus] = useState(user?.status || 'active');
  
  // Profile Metadata
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [middleName, setMiddleName] = useState(user?.middle_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [department, setDepartment] = useState(user?.department || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setRole(user.role || 'analyst');
      setStatus(user.status || 'active');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setMiddleName(user.middle_name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
      setJobTitle(user.job_title || '');
      setDepartment(user.department || '');
      setError(null);
      setSuccess(null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profileData = {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        middle_name: middleName || undefined,
        email: email || undefined,
        phone_number: phoneNumber || undefined,
        job_title: jobTitle || undefined,
        department: department || undefined,
      };

      if (mode === 'create') {
        const data: CreateUserRequest = { 
          username, 
          password, 
          role,
          status,
          ...profileData
        };
        await adminApi.createUser(data);
        setSuccess(`Agent ${username} synchronized successfully!`);
        resetForm();
        onUserCreated?.();
      } else if (user) {
        if (role !== user.role) {
          await adminApi.updateUserRole(user.username, role);
        }
        // Handle Password Reset if provided
        if (password) {
          await adminApi.resetUserPassword(user.username, password);
        }
        // Handle Profile Update
        await adminApi.updateUserProfile(user.username, profileData);
        
        setSuccess(`Agent ${user.username} modified within identity vault.`);
        setPassword('');
        onUserUpdated?.();
      }
    } catch (err: any) {
      setError(err?.data?.detail || err.message || `Failed to ${mode} agent`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
     setUsername('');
     setPassword('');
     setRole('analyst');
     setFirstName('');
     setLastName('');
     setMiddleName('');
     setEmail('');
     setPhoneNumber('');
     setJobTitle('');
     setDepartment('');
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-3xl">
      <CardContent className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 flex items-center gap-3 animate-in shake duration-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wide">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wide">{success}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Securty Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security Credentials</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Login User ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      disabled={mode === 'edit'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 !border !border-mandatory focus:!border-mandatory/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-mandatory/10 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 transition-all uppercase"
                      placeholder="e.g. AGENT_DOE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    {mode === 'create' ? 'Access Password' : 'Reset Password (Optional)'}
                  </label>
                  <input
                    type="password"
                    required={mode === 'create'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 bg-white dark:bg-slate-950 !border rounded-2xl text-sm font-bold focus:ring-4 transition-all",
                      mode === 'create' 
                        ? "!border-mandatory focus:!border-mandatory/80 focus:ring-mandatory/10" 
                        : "!border-optional focus:!border-optional/80 focus:ring-optional/10"
                    )}
                    placeholder={mode === 'create' ? "••••••••" : "Leave blank to keep current"}
                  />
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4 mt-2">
                <User className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Agent Identification</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-optional focus:!border-optional/80 rounded-xl text-xs font-bold focus:ring-4 focus:ring-optional/10 transition-all"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-optional focus:!border-optional/80 rounded-xl text-xs font-bold focus:ring-4 focus:ring-optional/5 transition-all"
                    placeholder="Quincy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-optional focus:!border-optional/80 rounded-xl text-xs font-bold focus:ring-4 focus:ring-optional/10 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Identity
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-optional focus:!border-optional/80 rounded-xl text-xs font-bold focus:ring-4 focus:ring-optional/10 transition-all"
                placeholder="doe@enterprise.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-blue-500 focus:!border-blue-600 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                placeholder="+1 555-0123"
              />
            </div>

            {/* Professional Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-blue-500 focus:!border-blue-600 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                placeholder="Senior Legal Analyst"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <Building className="w-3 h-3" /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 !border !border-blue-500 focus:!border-blue-600 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                placeholder="Legal Operations"
              />
            </div>

            {/* Role/Hierarchy Section */}
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Capability Tier</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full px-4 py-3 bg-white dark:bg-slate-950 !border !border-mandatory focus:!border-mandatory/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-mandatory/10 transition-all">
                  <SelectValue placeholder="Select functional tier" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  {Object.entries(ROLE_HIERARCHY).map(([category, def], idx) => (
                    <React.Fragment key={category}>
                      {idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />}
                      <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <Shield className="w-3 h-3" />
                         {def.title}
                      </div>
                      {def.roles.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="rounded-xl py-2.5 mx-1 font-bold">
                          {r.name}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Account Status</label>
              <Select value={status} onValueChange={setStatus} disabled={mode === 'create'}>
                <SelectTrigger className="w-full px-4 py-3 bg-white dark:bg-slate-950 !border !border-optional focus:!border-optional/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-optional/10 transition-all">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <SelectItem value="active" className="text-xs font-bold py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded-xl m-1 transition-colors">
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs font-bold py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded-xl m-1 transition-colors">
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="deactivated" className="text-xs font-bold py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded-xl m-1 transition-colors">
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      Deactivated
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Synchronizing Vault...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {mode === 'create' ? <UserPlus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{mode === 'create' ? 'Finalize Onboarding' : 'Commit Profile Changes'}</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
