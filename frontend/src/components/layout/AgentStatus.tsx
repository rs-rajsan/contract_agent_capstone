import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { APP_CONFIG } from '../../utils/config';
import { cn } from '../../lib/utils';
import { Activity, AlertCircle, RefreshCcw } from 'lucide-react';
import { StatusChild } from '../../constants/error_cd_status_child';

interface AgentHealth {
  agent_name: string;
  status_code: number;
  latency_ms: number;
  user_facing_message: string;
}

export const AgentStatus: React.FC = () => {
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
      setError('Connection failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, APP_CONFIG.SYSTEM.HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (code: number) => {
    if (code === StatusChild.OK) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (code === StatusChild.MODEL_BUSY) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Agent Heartbeat
        </h3>
        <button 
          onClick={fetchStatus}
          disabled={isRefreshing}
          className={cn(
            "p-1 text-slate-400 hover:text-blue-500 transition-colors",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="px-2 space-y-1">
        {error ? (
          <div className="px-2 py-1.5 rounded-lg bg-red-500/5 flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        ) : agents.length > 0 ? (
          agents.map((agent) => (
            <div 
              key={agent.agent_name}
              className="group px-2 py-1.5 flex items-center justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300"
              title={`${agent.agent_name}: ${agent.user_facing_message} (${agent.latency_ms}ms)`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getStatusColor(agent.status_code))} />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate uppercase tracking-tight">
                  {agent.agent_name.replace(' Agent', '')}
                </span>
              </div>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-600 font-mono">
                {agent.latency_ms > 0 ? `${Math.round(agent.latency_ms)}ms` : '--'}
              </span>
            </div>
          ))
        ) : (
          <div className="px-2 py-2 flex flex-col items-center gap-2 text-slate-400">
             <Activity className="w-4 h-4 animate-pulse" />
             <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Initializing...</span>
          </div>
        )}
      </div>

      <div className="mt-4 px-4 flex items-center justify-between text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
        <span>Refresh: 30s</span>
        <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  );
};
