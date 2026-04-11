import { useState, useEffect, FC } from 'react';
import { Card } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Loader } from '../../shared/ui/loader';
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  ShieldAlert, 
  Globe, 
  Zap, 
  TrendingUp, 
  Calendar, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../shared/ui/select';
import { useContractHistory } from '../../../contexts/ContractHistoryContext';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StrategicData {
  risk_distribution: Record<string, number>;
  top_jurisdictions: { name: string; value: number }[];
  efficiency: {
    total_contracts: number;
    hours_saved: number;
    velocity_score: string;
  };
  strategic_value: {
    total_value_at_stake: number;
    high_risk_value: number;
    currency: string;
  };
}

export const StrategicInsightsView: FC = () => {
  const { contracts } = useContractHistory();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StrategicData | null>(null);
  
  // Filters state
  const [status, setStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [isContractSelectorOpen, setIsContractSelectorOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', status);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      selectedContractIds.forEach(id => {
        params.append('contract_ids', id);
      });

      const response = await fetch(`/api/strategic/insights?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      
      const json = await response.json();
      setData(json);
    } catch (err) {
      // Silent error for security - logs are handled server-side via StrategicAPI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, startDate, endDate, selectedContractIds]);

  const toggleContractSelection = (id: string) => {
    setSelectedContractIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const riskData = data ? Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value })) : [];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <Loader className="w-8 h-8 text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Aggregating Strategic Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-end gap-6">
          {/* Status Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 size={10} />
              Analysis Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px] font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Intelligence</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="pending">Pending/Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={10} />
              Intelligence Period
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <span className="text-slate-300">to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Contract Selector (Multi-select popup) */}
          <div className="relative space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={10} />
              Contract Filter
            </label>
            <button 
              onClick={() => setIsContractSelectorOpen(!isContractSelectorOpen)}
              className="flex items-center justify-between w-[200px] h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-all shadow-sm"
            >
              <span>{selectedContractIds.length > 0 ? `${selectedContractIds.length} Selected` : 'All Agreements'}</span>
              <ChevronDownIcon size={14} className="opacity-50" />
            </button>

            {isContractSelectorOpen && (
              <div className="absolute top-full left-0 z-50 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">Total: {contracts.length}</span>
                  <button 
                    onClick={() => setSelectedContractIds([])}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {contracts.map(contract => (
                    <label key={contract.contract_id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedContractIds.includes(contract.contract_id)}
                        onChange={() => toggleContractSelection(contract.contract_id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium truncate dark:text-slate-300">{contract.filename}</span>
                    </label>
                  ))}
                  {contracts.length === 0 && (
                    <p className="text-[10px] text-center py-4 text-slate-400 italic">No indexed contracts found.</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsContractSelectorOpen(false)}
                  className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={fetchData}
            className="h-9 px-4 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all ml-auto self-end"
          >
            Refresh Insights
          </button>
        </div>
      </div>

      {/* Insight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Distribution Chart */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-none shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Risk Profile</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Concentration</p>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {riskData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{item.value} Contracts</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Efficiency Card */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Zap size={160} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/20 text-white border-transparent backdrop-blur-md px-2 py-1">
                  Operational ROI
                </Badge>
                <Zap className="text-yellow-400 fill-yellow-400 animate-pulse" size={20} />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-1">{data?.efficiency.hours_saved || 0}h</h1>
                <p className="text-indigo-100 font-bold text-sm tracking-wide">Estimated Legal Hours Saved</p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Pipeline Flow</p>
                  <p className="font-black text-lg">{data?.efficiency.velocity_score || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Extraction Benchmark</p>
                  <p className="font-black text-lg">2h / file</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white dark:bg-slate-900 border-none shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Jurisdictional Spread</h3>
                </div>
              </div>
              <div className="space-y-3">
                {data?.top_jurisdictions.map((j) => (
                  <div key={j.name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400">{j.name}</span>
                      <span className="text-slate-900 dark:text-white">{j.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${(j.value / (data.efficiency.total_contracts || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
                {(!data?.top_jurisdictions || data.top_jurisdictions.length === 0) && (
                  <p className="text-xs text-slate-400 italic pt-4">No jurisdictional data available for the current selection.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Strategic Value Card */}
        <Card className="lg:col-span-3 p-8 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-emerald-400" size={24} />
                <h2 className="text-xl font-black uppercase tracking-widest">Aggregate Portfolio Exposure</h2>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                Real-time strategic valuation of all legal obligations under active intelligence. Reflects the identified total contract value (TCV) currently indexed in your multi-tenant graph.
              </p>
            </div>
            
            <div className="flex items-end gap-3 text-right">
              <div className="space-y-0">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Total Value at Stake</p>
                <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: data?.strategic_value.currency || 'USD' }).format(data?.strategic_value.total_value_at_stake || 0)}
                </h1>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ChevronDownIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
