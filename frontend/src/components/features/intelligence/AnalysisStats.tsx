import { FC } from 'react';
import { Card, CardContent } from '../../shared/ui/card';
import { TrendingUp, MoreVertical } from 'lucide-react';

interface AnalysisStatsProps {
  totalContracts: number;
  highRiskAlerts: number;
  complianceScore: number;
}

export const AnalysisStats: FC<AnalysisStatsProps> = ({ 
  totalContracts, 
  highRiskAlerts, 
  complianceScore 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Contracts */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Stat</span>
            <MoreVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 cursor-pointer" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Contracts Analyzed</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{totalContracts.toLocaleString()}</span>
            <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +5.2% this month
            </span>
          </div>
        </CardContent>
      </Card>

      {/* High-Risk Alerts */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Stat</span>
            <MoreVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 cursor-pointer" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">High-Risk Alerts</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{highRiskAlerts}</span>
            <div className="flex gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 uppercase tracking-tighter mt-1 block">Critical Attention Required</span>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Stat</span>
            <MoreVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 cursor-pointer" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Compliance Score</h3>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-slate-800">{complianceScore}%</span>
              <span className="text-xs font-bold text-green-600 uppercase tracking-tighter block mt-1">Strong Alignment</span>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="relative w-16 h-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-8 border-slate-100" />
                <div 
                  className="absolute top-0 left-0 w-16 h-16 rounded-full border-8 border-green-500 border-t-transparent border-r-transparent -rotate-45" 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
