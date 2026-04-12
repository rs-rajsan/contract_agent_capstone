import { FC, useState, useEffect } from 'react';
import { Activity, Shield, DollarSign, Calendar } from 'lucide-react';
import { analyticsApi, AnalyticsResponse, GovernanceResponse, CostingResponse } from '../services/analyticsApi';
import { AuditorView } from '../components/features/analytics/AuditorView';
import { GovernanceView } from '../components/features/analytics/GovernanceView';
import { CostingView } from '../components/features/analytics/CostingView';
import { HeartbeatInsights } from './HeartbeatInsights';

export const AnalyticsPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'heartbeat' | 'governance' | 'costing'>('analytics');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [auditorData, setAuditorData] = useState<AnalyticsResponse | null>(null);
  const [governanceData, setGovernanceData] = useState<GovernanceResponse | null>(null);
  const [costingData, setCostingData] = useState<CostingResponse | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aData, gData, cData] = await Promise.all([
        analyticsApi.getKPIs(timeRange, startDate, endDate),
        analyticsApi.getGovernanceData(timeRange, startDate, endDate),
        analyticsApi.getCostingData(timeRange, startDate, endDate)
      ]);
      setAuditorData(aData);
      setGovernanceData(gData);
      setCostingData(cData);
    } catch (err: any) {
      console.error('Failed to fetch analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeRange !== 'custom') {
        fetchData();
    }
  }, [timeRange]);

  if (loading && !auditorData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hydrating Analytics Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Dynamic Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                        {activeTab === 'analytics' ? "Audit Analytics" : activeTab === 'heartbeat' ? "Agent Heartbeat" : activeTab === 'governance' ? "Governance & Activity" : "Financial Audit & Costing"}
                    </h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live Ledger</span>
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm leading-relaxed font-sans">
                    {activeTab === 'analytics' 
                    ? "Real-time accountability and performance metrics for the agentic pipeline. Visualized from the Trace-First JSONL audit stream."
                    : activeTab === 'heartbeat'
                    ? "Live diagnostic telemetry and health status for all autonomous agents in the orchestration layer."
                    : activeTab === 'governance'
                    ? "Enterprise-grade visibility into user actions, data compliance, and system-wide audit trails from the audit.jsonl ledger."
                    : "Strategic insights into AI expenditure, token efficiency, and forward-looking budget projections for leadership."}
                </p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-600">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Report Window</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        {timeRange === 'custom' ? `${startDate} to ${endDate}` : timeRange}
                    </span>
                </div>
            </div>
        </div>

        {/* Browser-Style Navigation Tabs */}
        <div className="space-y-4">
            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
                activeTab === 'analytics' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
            >
                <Shield size={16} />
                Audit Analytics
                {activeTab === 'analytics' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
            </button>
            <button 
                onClick={() => setActiveTab('heartbeat')}
                className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
                activeTab === 'heartbeat' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
            >
                <Activity size={16} />
                Agent Heartbeat
                {activeTab === 'heartbeat' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
            </button>
            <button 
                onClick={() => setActiveTab('governance')}
                className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
                activeTab === 'governance' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
            >
                <Shield size={16} />
                Governance
                {activeTab === 'governance' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
            </button>
            <button 
                onClick={() => setActiveTab('costing')}
                className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
                activeTab === 'costing' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
            >
                <DollarSign size={16} />
                Costing
                {activeTab === 'costing' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
            </button>
            </div>

            {/* Adjusted Temporal Filter Bar - Left Aligned and Larger */}
            <div className="flex flex-col md:flex-row md:items-center justify-start gap-12 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[140px]">
                    <Calendar className="w-4 h-4" />
                    Temporal Filter
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        {(['24h', '7d', '30d', '90d', 'custom'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                    timeRange === range 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={() => fetchData()}
                                className="ml-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                Apply Range
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {loading && activeTab !== 'heartbeat' ? (
          <div className="flex items-center justify-center h-[400px]">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
      ) : activeTab === 'analytics' ? (
        auditorData && <AuditorView data={auditorData} />
      ) : activeTab === 'heartbeat' ? (
        <HeartbeatInsights />
      ) : activeTab === 'governance' ? (
        governanceData && <GovernanceView data={governanceData} />
      ) : (
        costingData && <CostingView data={costingData} />
      )}
    </div>
  );
};
