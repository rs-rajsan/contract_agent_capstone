import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Cpu, 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Zap,
  Target,
  ArrowUpRight,
  Lightbulb,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { CostingResponse } from '../../../services/analyticsApi';
import { ShadowFilter } from '../../shared/ui/CommonFilters';

interface CostingViewProps {
  data: CostingResponse;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];


export const CostingView: React.FC<CostingViewProps> = ({ data }) => {
  const getLatencyColor = (avg: number, min: number, max: number) => {
    if (max === min) return 'text-indigo-600';
    const score = (avg - min) / (max - min);
    if (score < 0.33) return 'text-emerald-500';
    if (score < 0.66) return 'text-amber-500';
    return 'text-rose-500';
  };

  const kpis = [
    { 
        title: 'Total AI Spend', 
        value: `$${data.summary.total_spend}`, 
        icon: DollarSign, 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-50',
        desc: 'Selected time range'
    },
    { 
        title: 'Avg Cost / Contract', 
        value: `$${data.summary.cost_per_contract}`, 
        icon: Target, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50',
        desc: 'End-to-end processing'
    },
    { 
        title: 'Total Tokens', 
        value: data.summary.total_tokens.toLocaleString(), 
        icon: Cpu, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50',
        desc: 'Compute volume',
        isTokens: true
    },
    { 
        title: '30D Projected Cost', 
        value: `$${data.summary.projected_30d_cost}`, 
        icon: TrendingUp, 
        color: 'text-rose-600', 
        bg: 'bg-rose-50',
        desc: 'Forward forecast'
    },
    { 
        title: 'System Latency', 
        value: `${data.summary.avg_latency_ms}ms`, 
        icon: Clock, 
        color: getLatencyColor(data.summary.avg_latency_ms, data.summary.min_latency_ms, data.summary.max_latency_ms), 
        bg: 'bg-purple-50',
        desc: 'Avg response time'
    },
  ];

  const tokenPieData = [
    { name: 'Input', value: data.efficiency.input_tokens, fill: '#6366f1' },
    { name: 'Output', value: data.efficiency.output_tokens, fill: '#10b981' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ShadowFilter />
      
      {/* Leadership KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <CardContent className="p-6 relative">
              {data.summary.is_extrapolated && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter z-10">
                      Estimated
                  </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${kpi.bg} dark:bg-slate-800 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                {kpi.isTokens ? (
                    <div className="w-32 h-12">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tokenPieData}
                                    cx="35%"
                                    cy="50%"
                                    innerRadius={15}
                                    outerRadius={22}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {tokenPieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={tokenPieData[index].fill} />
                                    ))}
                                </Pie>
                                <Legend 
                                    layout="vertical" 
                                    align="right" 
                                    verticalAlign="middle" 
                                    iconSize={6}
                                    wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', paddingLeft: '4px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Financial</span>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold mt-1">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            Active
                        </div>
                    </div>
                )}
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 font-display">{kpi.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${kpi.color || 'text-slate-900 dark:text-white'} tabular-nums tracking-tight font-display`}>
                  {kpi.value}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium font-sans">
                {kpi.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Spend Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 font-display">
                    <BarChartIcon className="w-4 h-4 text-indigo-500" />
                    Compute Spend Velocity & Forecast
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    unit="$"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Allocation */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 font-display">
              <Zap className="w-4 h-4 text-amber-500" />
              Budget Watch
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase font-display">Quota Utilization</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-display">{data.summary.budget_utilization}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${data.summary.budget_utilization > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        style={{ width: `${data.summary.budget_utilization}%` }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Monthly Threshold: ${data.summary.budget_limit}</p>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 font-display">Cost by Intelligence Agent</h4>
                <div className="space-y-3">
                    {data.agents.slice(0, 5).map((agent, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">{agent.name}</span>
                                <span className="font-bold text-slate-900 dark:text-white">${agent.cost}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-400 transition-all duration-1000"
                                    style={{ width: `${(agent.cost / data.summary.total_spend) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency & Vendor Negotiation Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 font-display">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              Model Portfolio Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.models}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="cost"
                  strokeWidth={2}
                  stroke="#fff"
                  filter="url(#pieShadow)"
                >
                  {data.models.map((_entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="p-8 rounded-2xl bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
            <Lightbulb className="absolute -right-12 -top-12 w-48 h-48 text-indigo-500/20 group-hover:text-indigo-500/30 transition-all duration-500" />
            <h4 className="text-xl font-black mb-4 flex items-center gap-2 font-display">
                <Zap className="w-5 h-5 text-amber-400" />
                Negotiation Intelligence
            </h4>
            <div className="space-y-4 relative z-10">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1 font-display">Batch Savings Opportunity</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Detected high volume of asynchronous redlining. You can negotiate for <strong>50% off</strong> by utilizing Batch API credits.
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1 font-display">Prompt Caching Insight</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Output tokens are currently {data.efficiency.ratio}x input. Caching system prompts could reduce input costs by <strong>32%</strong>.
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1 font-display">SLA Compliance Point</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Tracked 14 events with &gt;15s latency. Present these logs to your provider for a <strong>Tier 2 Service Credit</strong>.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
