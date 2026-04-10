import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Shield, Activity, AlertTriangle, Clock, TrendingUp, CheckCircle, Search } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { AnalyticsResponse } from '../../../services/analyticsApi';

interface AuditorViewProps {
  data: AnalyticsResponse;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AuditorView: React.FC<AuditorViewProps> = ({ data }) => {
  const kpis = [
    { 
        title: 'Hallucination Rate', 
        value: data.summary.hallucination_rate, 
        icon: AlertTriangle, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50',
        desc: `${data.summary.total_hallucinations} incidents blocked`
    },
    { 
        title: 'Avg Turnaround (MTAT)', 
        value: data.summary.avg_latency_seconds, 
        icon: Clock, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50',
        desc: 'End-to-end trace duration'
    },
    { 
        title: 'System Health', 
        value: data.summary.system_health, 
        icon: Shield, 
        color: 'text-green-500', 
        bg: 'bg-green-50',
        desc: 'Based on integrity checks'
    },
    { 
        title: 'Documents Processed', 
        value: data.summary.total_processed, 
        icon: Search, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50',
        desc: 'Unique correlation chains'
    },
  ];

  const barData = data.agent_breakdown.map(agent => ({
    name: agent.name.replace('Agent', ''),
    latency: parseInt(agent.avg_node_latency.replace('ms', '')),
    success: parseFloat(agent.success_rate.replace('%', ''))
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Stream */}
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

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Activity className="w-4 h-4 text-blue-500" />
              Node Latency & Effort Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    unit="ms"
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="latency" radius={[6, 6, 0, 0]} barSize={40}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Agent Precision Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 flex flex-col items-center">
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={barData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="success"
                        >
                            {barData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 space-y-2 w-full">
                {data.agent_breakdown.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{agent.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">{agent.success_rate}</span>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg overflow-hidden relative">
            <Shield className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
            <h4 className="text-lg font-bold mb-2">Immutable Accountability</h4>
            <p className="text-white/80 text-xs leading-relaxed max-w-lg">
                This dashboard uses <strong>Aggregator Nodes</strong> to stream directly from the <code>unified_agent_audit.jsonl</code>. 
                Every data point on this screen represents a cryptographically verifiable agent operation, ensuring absolute 
                transparency for your legal and compliance teams.
            </p>
            <div className="mt-6 flex gap-4">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">
                    <span className="block text-[10px] font-bold text-white/60 uppercase">Retention</span>
                    <span className="font-bold">Permanent</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">
                    <span className="block text-[10px] font-bold text-white/60 uppercase">Audit Level</span>
                    <span className="font-bold">Stage-Wise</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
