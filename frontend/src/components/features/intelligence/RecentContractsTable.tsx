import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Eye, Edit2, MoreHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RecentContractsTableProps {
  contracts: any[];
  onSelect: (contractId: string) => void;
}

export const RecentContractsTable: FC<RecentContractsTableProps> = ({ contracts, onSelect }) => {
  // Map raw contracts to table records with dummy data for counterparty/trend if missing
  const records = contracts.slice(0, 5).map(c => ({
    ...c,
    counterparty: 'Acme Corp', // Default for demo
    type: 'Service Agreement', // Default for demo
    risk_trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH': return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
      case 'SAFE':
      case 'LOW': return 'bg-green-100 text-green-700 hover:bg-green-100';
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Grid</span>
            <CardTitle className="text-xl font-bold text-slate-800 mt-1">Recent Contracts & Risk Status</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-500 text-xs font-semibold">View All Items</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Contract Name</th>
                <th className="px-6 py-4">Counterparty</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Risk Status</th>
                <th className="px-6 py-4 text-center">Trend</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((contract) => (
                <tr 
                  key={contract.contract_id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => onSelect(contract.contract_id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors shadow-sm">
                        <span className="text-slate-600 font-bold">📄</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                        {contract.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 font-medium">{contract.counterparty}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{contract.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-tighter ${getRiskBadgeVariant(contract.risk_level)}`}>
                      {contract.risk_level || 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className="p-1 bg-slate-50 rounded shadow-inner">
                        {getTrendIcon(contract.risk_trend)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 font-mono">
                      {new Date(contract.upload_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="py-12 text-center">
               <span className="text-slate-400 text-sm">No contracts found in history</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
