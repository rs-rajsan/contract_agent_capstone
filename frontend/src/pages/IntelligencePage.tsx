import { useState, FC } from 'react';
import { DocumentUpload } from '../components/features/contracts/DocumentUpload';
import { ContractIntelligence } from '../components/features/intelligence/ContractIntelligence';
import { RecentContractsTable } from '../components/features/intelligence/RecentContractsTable';
import { Card } from '../components/shared/ui/card';
import { useContractHistory } from '../contexts/ContractHistoryContext';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details?: string;
  model_used: string;
}

export const IntelligencePage: React.FC = () => {
  const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
  const AVAILABLE_MODELS_ENV = import.meta.env.VITE_AVAILABLE_MODELS || 'gemini-2.5-flash,gemini-1.5-pro,gpt-4o,sonnet-3.5';
  
  const modelOptions = AVAILABLE_MODELS_ENV.split(',').map(m => m.trim());
  
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const { contracts, addContract, updateContract, setSelectedContract } = useContractHistory();

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    // Automatically expand when a new contract is analyzed/uploaded
    setIsReportExpanded(true);

    if (result.contract_id) {
      addContract({
        contract_id: result.contract_id,
        filename: result.filename,
        upload_date: new Date().toISOString(),
        model_used: result.model_used,
        analysis_completed: false
      });
    }
  };

  const handleUploadStart = () => {
    setUploadResult(null);
    setIsReportExpanded(false);
  };

  const handleWorkflowUpdate = (status: any) => {
    setWorkflowStatus(status);
  };

  const handleAnalysisComplete = (contractId: string, riskScore?: number, riskLevel?: string, results?: any) => {
    updateContract(contractId, {
      analysis_completed: true,
      risk_score: riskScore,
      risk_level: riskLevel,
      analysis_results: results
    });
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Contract Intelligence Hub</h1>
          <p className="text-lg text-slate-500 font-medium opacity-80">
            Analyze and manage your contracts with AI-driven insights.
          </p>
        </div>

        {/* Repositioned Minimal Upload Hub */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800">Intelligence Analysis</h2>
            <div className="flex items-center gap-3 ml-auto">
              <label className="text-sm font-semibold text-slate-700">AI Model:</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-3 py-1 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modelOptions.map(model => (
                  <option key={model} value={model}>
                    {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DocumentUpload
            variant="minimal"
            onUploadComplete={handleUploadComplete}
            onWorkflowUpdate={handleWorkflowUpdate}
            onUploadStart={handleUploadStart}
          />
        </div>
      </div>

      <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

      {/* Collapsible Analysis Results Section */}
      {uploadResult?.contract_id && (
        <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Header - Interactive Toggle */}
          <div 
            onClick={() => setIsReportExpanded(!isReportExpanded)}
            className="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Detailed Analysis Report</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  {uploadResult.filename}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl group-hover:bg-slate-200 transition-all">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isReportExpanded ? 'Collapse' : 'Expand Report'}
              </span>
              {isReportExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>

          {/* Animated Collapsible Container */}
          <div className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden bg-slate-50/50",
            isReportExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="p-8">
              <ContractIntelligence
                contractId={uploadResult.contract_id}
                onWorkflowUpdate={handleWorkflowUpdate}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Recent Contracts Table Section */}
      <div className="space-y-4">
        <RecentContractsTable 
          contracts={contracts} 
          onSelect={(id) => {
            const contract = contracts.find(c => c.contract_id === id);
            if (contract) {
              setSelectedContract(id);
              handleUploadComplete({
                filename: contract.filename,
                status: 'success',
                contract_id: contract.contract_id,
                details: 'Contract loaded from history',
                model_used: contract.model_used
              });
            }
          }} 
        />
      </div>
    </div>
  );
};