import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/apiClient';
import { APP_CONFIG } from '../utils/config';
import { cn } from '../lib/utils';
import { Activity, AlertCircle, RefreshCcw, Cpu, Clock, Zap } from 'lucide-react';
import { StatusChild } from '../constants/error_cd_status_child';
import { Card, CardContent } from '../components/shared/ui/card';
import { Badge } from '../components/shared/ui/badge';

interface AgentHealth {
  agent_name: string;
  status_code: number;
  latency_ms: number;
  user_facing_message: string;
}

export const HeartbeatInsights: React.FC = () => {
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiRequest<{results: AgentHealth[]}>('/api/monitoring/system/health');
      setAgents(response.results);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError('System monitoring link interrupted');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, APP_CONFIG.SYSTEM.HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getStatusDetails = (code: number) => {
    if (code === StatusChild.OK) return {
        color: 'bg-emerald-500',
        text: 'Optimal',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        border: 'border-emerald-100 dark:border-emerald-900/30'
    };
    if (code === StatusChild.MODEL_BUSY) return {
        color: 'bg-amber-500',
        text: 'High Demand',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        border: 'border-amber-100 dark:border-amber-900/30'
    };
    return {
        color: 'bg-red-500',
        text: 'Degraded',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        border: 'border-red-100 dark:border-red-900/30'
    };
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Live Agent <span className="text-purple-600 uppercase">Heartbeat</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                Sub-second multi-agent health & latency diagnostics
            </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Last Sync</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
            <button 
                onClick={fetchStatus}
                disabled={isRefreshing}
                className={cn(
                    "p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-purple-500 transition-all hover:shadow-md",
                    isRefreshing && "animate-spin text-purple-500"
                )}
            >
                <RefreshCcw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10 transition-all duration-700">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-center">
                <h3 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Signal Loss</h3>
                <p className="text-[11px] font-bold text-red-600/70 dark:text-red-400/50 uppercase tracking-tight">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const status = getStatusDetails(agent.status_code);
            return (
              <Card 
                key={agent.agent_name}
                className={cn(
                    "relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group border bg-white dark:bg-slate-900",
                    status.border
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-purple-500/10 transition-colors">
                        <Cpu className="w-5 h-5 text-purple-600" />
                    </div>
                    <Badge variant="outline" className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border-none transition-all duration-500",
                        agent.status_code === StatusChild.OK ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        agent.status_code === StatusChild.MODEL_BUSY ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        {status.text}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                            {agent.agent_name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-0.5 line-clamp-1 opacity-70">
                            {agent.user_facing_message}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 font-mono">
                                {agent.latency_ms > 0 ? `${Math.round(agent.latency_ms)}ms` : '--'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-black text-[9px] text-slate-400 uppercase tracking-widest">
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.color, status.glow)} />
                            Pulse
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
           <div className="relative">
               <Zap className="w-12 h-12 text-slate-200 dark:text-slate-800 animate-pulse" />
               <Activity className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-bounce" />
           </div>
           <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Calibrating global intelligence...</p>
        </div>
      )}
    </div>
  );
};
