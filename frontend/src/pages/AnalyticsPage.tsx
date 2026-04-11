import { FC, useState, useEffect } from 'react';
import { AlertTriangle, Activity, Shield } from 'lucide-react';
import { analyticsApi, AnalyticsResponse, GovernanceResponse } from '../services/analyticsApi';
import { AuditorView } from '../components/features/analytics/AuditorView';
import { GovernanceView } from '../components/features/analytics/GovernanceView';

export const AnalyticsPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auditor' | 'governance'>('auditor');
  const [auditorData, setAuditorData] = useState<AnalyticsResponse | null>(null);
  const [governanceData, setGovernanceData] = useState<GovernanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aData, gData] = await Promise.all([
          analyticsApi.getKPIs(),
          analyticsApi.getGovernanceData()
        ]);
        setAuditorData(aData);
        setGovernanceData(gData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse text-sm">Aggregating Audit Intelligence...</p>
      </div>
    );
  }

  if (error || !auditorData || !governanceData) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-[60vh] gap-4">
        <div className="p-4 rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Analytics Unavailable</h2>
        <p className="text-slate-500 text-center max-w-md">{error || 'No data found in audit logs.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Dynamic Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight font-display">
            {activeTab === 'auditor' ? "Auditor's Intelligence" : "Governance & Activity"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
            {activeTab === 'auditor' 
              ? "Real-time accountability and performance metrics for the agentic pipeline. Visualized from the Trace-First JSONL audit stream."
              : "Enterprise-grade visibility into user actions, data compliance, and system-wide audit trails from the audit.jsonl ledger."}
          </p>
        </div>

        {/* Browser-Style Navigation Tabs (Isolated & Logic-Safe) */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('auditor')}
            className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
              activeTab === 'auditor' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            <Shield size={16} />
            AI Auditor
            {activeTab === 'auditor' && (
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
            <Activity size={16} />
            Governance
            {activeTab === 'governance' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {activeTab === 'auditor' ? (
        <AuditorView data={auditorData} />
      ) : (
        <GovernanceView data={governanceData} />
      )}
    </div>
  );
};
