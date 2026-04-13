import React from 'react';
import { 
  Cpu, 
  Database, 
  Activity, 
  Shield, 
  Clock, 
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { APP_CONFIG } from '../../utils/config';

export const SystemConfig: React.FC = () => {
  const { 
    settings, 
    updateSetting, 
    toggleDiagnostics, 
    toggleHeartbeat,
    isDiagnosticsEnabled,
    isHeartbeatEnabled
  } = useSystemSettings();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100 uppercase">
            System <span className="text-blue-600 dark:text-blue-400">Pulse</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            Core Architectural Orchestration & Health Controls
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black uppercase text-slate-500">Last Sync: {new Date(settings.lastUpdated).toLocaleTimeString()}</span>
           </div>
        </div>
      </div>

      {/* Diagnostic Toggle Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
          
          <div className="relative flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Proactive Diagnostics</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                Enable or disable the comprehensive full-screen health check that runs during application initialization. 
                Disabling this allows faster startup but may hide underlying service outages.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={toggleDiagnostics}
                className={cn(
                  "relative w-20 h-10 rounded-full transition-all duration-300 p-1 cursor-pointer",
                  isDiagnosticsEnabled ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-slate-200 dark:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full bg-white shadow-md transition-all duration-300 transform",
                  isDiagnosticsEnabled ? "translate-x-10" : "translate-x-0"
                )} />
              </button>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isDiagnosticsEnabled ? "text-emerald-600" : "text-slate-400"
              )}>
                {isDiagnosticsEnabled ? "Active" : "Bypassed"}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-4">
             <div className="flex -space-x-2">
                {APP_CONFIG.SYSTEM.MONITORED_AGENTS.slice(0, 4).map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                     <Shield className="w-3 h-3 text-slate-400" />
                  </div>
                ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monitoring {APP_CONFIG.SYSTEM.MONITORED_AGENTS.length} system agents</span>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-blue-600 dark:bg-blue-600/90 text-white shadow-2xl shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
           <div>
              <div className="flex items-center justify-between mb-6">
                <Clock className="w-8 h-8 opacity-80" />
                <button
                  onClick={toggleHeartbeat}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-all duration-300 p-0.5 cursor-pointer",
                    isHeartbeatEnabled ? "bg-white" : "bg-blue-400"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full transition-all duration-300 transform",
                    isHeartbeatEnabled ? "translate-x-6 bg-blue-600" : "translate-x-0 bg-white"
                  )} />
                </button>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Service<br/>Heartbeat</h3>
              <p className="text-xs text-blue-100/70 font-medium uppercase tracking-wider mb-8">
                {isHeartbeatEnabled ? "Interval Synchronization" : "Polling Deactivated"}
              </p>
              
              <div className={cn("space-y-2 transition-opacity duration-300", !isHeartbeatEnabled && "opacity-30 pointer-events-none")}>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                    <span>Rate</span>
                    <span>{settings.heartbeatInterval / 1000}s</span>
                 </div>
                 <input 
                    type="range" 
                    min="5000" 
                    max="60000" 
                    step="5000"
                    value={settings.heartbeatInterval}
                    onChange={(e) => updateSetting('heartbeatInterval', parseInt(e.target.value))}
                    className="w-full accent-white opacity-80"
                 />
              </div>
           </div>
           <p className="text-[10px] text-blue-100/50 mt-6 font-medium italic">
              {isHeartbeatEnabled ? "Currently monitoring system integrity." : "Background health checks paused."}
           </p>
        </div>
      </div>

      {/* Configuration Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Database className="w-4 h-4" />
          Configuration Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[
             { label: 'Application Title', value: APP_CONFIG.TITLE, icon: Info },
             { label: 'Primary Language Model', value: 'Gemini 1.5 Pro', icon: Cpu, status: 'Connected' },
             { label: 'Database Protocol', value: 'Bolt/Neo4j', icon: Database, status: 'Encrypted' },
             { label: 'Sidebar Geometry', value: APP_CONFIG.LAYOUT.SIDEBAR_WIDTH, icon: ChevronRight },
           ].map((item, i) => (
              <div key={i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                       <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                       <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{item.label}</span>
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.value}</span>
                    </div>
                 </div>
                 {item.status && (
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-black uppercase text-emerald-600">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      {item.status}
                   </div>
                 )}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};
