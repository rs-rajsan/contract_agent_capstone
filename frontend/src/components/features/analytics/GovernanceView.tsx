import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { GovernanceResponse } from '../../../services/analyticsApi';
import { Activity, Shield, Users, AlertTriangle, Search, TrendingUp, Clock } from 'lucide-react';

interface GovernanceViewProps {
  data: GovernanceResponse;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const GovernanceView: React.FC<GovernanceViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrail = useMemo(() => {
    return data.recent_trail.filter(entry => 
      entry.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.recent_trail, searchTerm]);

  const complianceRate = data.compliance_health.success > 0 
    ? Math.round((data.compliance_health.success / (data.compliance_health.success + data.compliance_health.failure)) * 100) 
    : 0;

  const kpis = [
    { 
        title: 'System Uptime', 
        value: '99.9%', 
        icon: Activity, 
        color: 'text-indigo-500', 
        bg: 'bg-indigo-50',
        desc: 'All legal nodes online'
    },
    { 
        title: 'Compliance Rate', 
        value: `${complianceRate}%`, 
        icon: Shield, 
        color: 'text-green-500', 
        bg: 'bg-green-50',
        desc: 'Validation success rate'
    },
    { 
        title: 'Governance Errors', 
        value: data.compliance_health.failure, 
        icon: AlertTriangle, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50',
        desc: 'Logged in audit.jsonl'
    },
    { 
        title: 'Active Tenants', 
        value: data.user_activity.length, 
        icon: Users, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50',
        desc: 'Unique org IDs'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${kpi.bg} dark:bg-slate-800 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">KPI</span>
                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold mt-1">
                        <TrendingUp className="w-2.5 h-2.5" />
                        Live
                    </div>
                </div>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{kpi.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{kpi.value}</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                {kpi.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Distribution */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Activity className="w-4 h-4 text-blue-500" />
              Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.activity_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.activity_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 24-Hour Activity Pulse */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Clock className="w-4 h-4 text-indigo-500" />
              24-Hour Activity Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_trend}>
                <defs>
                  <linearGradient id="colorCountGov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorCountGov)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
        <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-lg text-white">
                <Shield className="w-4 h-4" />
             </div>
             <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">System Audit Trail</CardTitle>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Live Ledger from audit.jsonl</p>
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Filter audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border-none rounded-xl py-2 pl-9 pr-4 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64 transition-all"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-sm font-medium">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Event Type</th>
                <th className="px-8 py-4">Action Context</th>
                <th className="px-8 py-4">Resource ID</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTrail.map((entry, idx) => (
                <tr key={idx} className="hover:bg-indigo-500/5 transition-colors group">
                  <td className="px-8 py-4 text-xs font-mono text-slate-500">{entry.timestamp}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold">
                      {entry.event}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-400 leading-tight max-w-xs truncate">
                    {entry.action}
                  </td>
                  <td className="px-8 py-4 text-xs text-indigo-400/70 font-mono italic">
                    {entry.resource}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.status === 'success' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                    }`}>
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrail.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No matching audit entries found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
