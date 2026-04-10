import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, Database, Network, Cpu, Server } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DiagnosticResult {
  agent_name: string;
  component: string;
  status_code: number;
  user_facing_message: string;
  latency_ms: number;
}

interface DiagnosticScreenProps {
  onComplete: () => void;
}

export const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ onComplete }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const runDiagnostics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/monitoring/system/health');
        const data = await response.json();
        
        setResults(data.results);
        
        if (data.status === 'healthy') {
          // Add a small delay for aesthetic transition
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          const failed = data.results.find((r: any) => r.status_code !== 200);
          setError(failed?.user_facing_message || "System health check failed.");
        }
      } catch (err) {
        setError("Unable to reach backend services. Please ensure the server is running.");
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, [onComplete, retryCount]);

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'database': return <Database className="w-5 h-5" />;
      case 'embeddings': return <Network className="w-5 h-5" />;
      case 'llm': return <Cpu className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl p-8 mx-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl animate-pulse">
            <ShieldCheck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            System Diagnostics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            System Health check is in progress, please wait till it is complete
          </p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {results.length > 0 ? (
            results.map((res, index) => (
              <div 
                key={res.agent_name}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all duration-500 animate-in slide-in-from-bottom-4",
                  res.status_code === 200 
                    ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30" 
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    res.status_code === 200 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600"
                  )}>
                    {getComponentIcon(res.component)}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {res.agent_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Category: {res.component.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   {res.status_code === 200 ? (
                     <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                       <span className="hidden sm:inline">{res.latency_ms}ms</span>
                       <CheckCircle2 className="w-5 h-5" />
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-sm">
                       <span className="hidden sm:inline">Code: {res.status_code}</span>
                       <AlertCircle className="w-5 h-5" />
                     </div>
                   )}
                </div>
              </div>
            ))
          ) : (
            // Skeleton / Loading State
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-20 h-3 bg-slate-100 dark:bg-slate-900 rounded" />
                  </div>
                </div>
                <div className="w-12 h-6 bg-slate-100 dark:bg-slate-900 rounded" />
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-4 animate-in zoom-in-95 duration-300">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-rose-900 dark:text-rose-100 mb-1">Diagnostic Failure</h4>
              <p className="text-rose-700 dark:text-rose-300 text-sm mb-4 leading-relaxed">
                {error}
              </p>
              <button 
                onClick={() => setRetryCount(c => c + 1)}
                className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-rose-900/20"
              >
                Re-Scan System
              </button>
            </div>
          </div>
        )}

        {!error && loading && (
            <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium italic">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Intelligence Infrastructure...
                </div>
            </div>
        )}

        {/* Brand Footer */}
        <div className="mt-12 text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold">
                Contract Agent Capstone • v1.0.0
            </span>
        </div>
      </div>
    </div>
  );
};
