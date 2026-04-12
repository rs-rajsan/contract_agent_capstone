import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/useRouter';
import { authApi } from '../services/authApi';
import { logger } from '../utils/logger';
import { Shield, Lock, User, Key, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { navigate } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError(null);
    setIsSubmitting(true);
    logger.info('Login attempt', { username });

    try {
      const response = await authApi.login(username, password);
      login(response.access_token, response.user);
      logger.info('Login successful', { username });
      navigate('intelligence'); 
    } catch (err: any) {
      logger.warn('Login failed', { username, error: err });
      if (err.status === 401) {
        setError('Invalid username or password');
      } else {
        const detail = err.data?.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          // FastAPI 422 errors are usually a list of error objects
          setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join('. '));
        } else if (detail && typeof detail === 'object') {
          setError(JSON.stringify(detail));
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in duration-700">
        {/* Header */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="relative mt-8 text-3xl font-black tracking-[-0.02em] text-white uppercase">
            Contract <span className="text-blue-400">Intelligence</span>
          </h2>
          <p className="relative mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            Autonomous Orchestration Suite
          </p>
        </div>

        {/* Form */}
        <div className="p-10 space-y-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-[11px] font-bold uppercase tracking-tight text-red-600 ring-1 ring-inset ring-red-500/20 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500" htmlFor="username">
                  Identity
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border-0 py-4 pl-12 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 placeholder:font-medium focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all bg-slate-50/50"
                    placeholder="USERNAME"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500" htmlFor="password">
                  Security Key
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 py-4 pl-12 pr-12 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 placeholder:font-medium focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all bg-slate-50/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
              )}
              {isSubmitting ? 'Authenticating...' : 'Establish Connection'}
            </button>
          </form>
          
          <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Secured via AES-256 & SHA-512
          </p>
        </div>
      </div>
    </div>
  );
}
