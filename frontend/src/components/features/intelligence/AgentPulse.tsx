import React from 'react';
import { Card, CardContent } from '../../shared/ui/card';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Search, 
  ShieldCheck, 
  FileSearch,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface AgentExecution {
  agent_name: string;
  agent_role: string;
  status: 'processing' | 'completed' | 'error';
  input_summary: string;
  output_summary: string;
  processing_time_ms: number;
  error_message?: string;
}

export interface WorkflowStatus {
  total_agents: number;
  completed_agents: number;
  failed_agents: number;
  agent_executions: AgentExecution[];
}

interface AgentPulseProps {
  status: WorkflowStatus | null;
  className?: string;
}

export const AgentPulse: React.FC<AgentPulseProps> = ({ status, className }) => {
  if (!status || status.agent_executions.length === 0) return null;

  const getAgentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('loading')) return <Zap className="w-5 h-5 text-blue-400" />;
    if (n.includes('ocr') || n.includes('processing')) return <Search className="w-5 h-5 text-indigo-400" />;
    if (n.includes('legal') || n.includes('clause')) return <FileSearch className="w-5 h-5 text-emerald-400" />;
    if (n.includes('policy')) return <ShieldCheck className="w-5 h-5 text-purple-400" />;
    if (n.includes('risk')) return <ShieldCheck className="w-5 h-5 text-amber-400" />;
    return <Cpu className="w-5 h-5 text-slate-400" />;
  };

  const getStatusIcon = (execution: AgentExecution) => {
    switch (execution.status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={cn("space-y-4 animate-in fade-in slide-in-from-top-4 duration-500", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg animate-pulse" />
          <div className="relative bg-blue-600/10 border border-blue-500/20 p-2 rounded-xl text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Agent Pulse
            <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Live Pipeline
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Multi-agent executive orchestration in progress
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {status.agent_executions.map((execution, idx) => (
          <Card 
            key={`${execution.agent_name}-${idx}`}
            className={cn(
              "border-none transition-all duration-300 overflow-hidden relative group",
              execution.status === 'processing' 
                ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg ring-1 ring-blue-500/20" 
                : "bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm opacity-80"
            )}
          >
            {/* Active Highlight Bar */}
            {execution.status === 'processing' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 animate-pulse" />
            )}

            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors duration-300",
                    execution.status === 'processing' 
                      ? "bg-blue-500/10 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-inner" 
                      : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500"
                  )}>
                    {getAgentIcon(execution.agent_name)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-sm font-bold tracking-tight",
                        execution.status === 'processing' ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {execution.agent_name}
                      </h3>
                      {getStatusIcon(execution)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-medium line-clamp-1">
                      {execution.agent_role}
                    </p>
                    
                    {execution.status === 'processing' && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            {execution.input_summary.substring(0, 40)}...
                          </span>
                        </div>
                      </div>
                    )}

                    {execution.status === 'completed' && (
                      <div className="pt-1 flex items-center gap-3 text-[10px] text-emerald-600 dark:text-emerald-500/80 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {execution.processing_time_ms}ms
                        </span>
                        <span className="h-1 w-1 rounded-full bg-emerald-500/40" />
                        <span className="truncate max-w-[200px]">
                          {execution.output_summary}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {execution.status === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-2 rounded-lg max-w-[200px]">
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight">
                      {execution.error_message || "Critical failure in agent logic"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-500" />
          <span>Real-time Tracing Active</span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-500">{status.completed_agents} Successful</span>
          {status.failed_agents > 0 && <span className="text-red-500">{status.failed_agents} Failed</span>}
        </div>
      </div>
    </div>
  );
};
