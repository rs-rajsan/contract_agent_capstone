import React, { useState, useEffect, FC } from 'react';
import { DocumentUpload } from '../components/features/contracts/DocumentUpload';
import { ContractIntelligence } from '../components/features/intelligence/ContractIntelligence';
import { RecentContractsTable } from '../components/features/intelligence/RecentContractsTable';
import { useContractHistory } from '../contexts/ContractHistoryContext';
import { Sparkles, Clock } from 'lucide-react';
import { useWorkflowTracer } from '../hooks/useWorkflowTracer';
import { StrategicInsightsView } from '../components/features/intelligence/StrategicInsightsView';

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details?: string;
  model_used: string;
}

export const IntelligencePage: FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'strategic'>('report');
  const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
  const AVAILABLE_MODELS_ENV = import.meta.env.VITE_AVAILABLE_MODELS || 'gemini-2.5-flash,gemini-1.5-pro,gpt-4o,sonnet-3.5';
  
  const modelOptions = AVAILABLE_MODELS_ENV.split(',').map((m: string) => m.trim());
  
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisPulse, setAnalysisPulse] = useState<string | null>(null);
  const { contracts, addContract, updateContract, selectedContractId, setSelectedContract } = useContractHistory();
  
  // Persistence Hydration ( survive page navigation )
  useEffect(() => {
    if (selectedContractId && !uploadResult) {
      const contract = contracts.find(c => c.contract_id === selectedContractId);
      if (contract) {
        setUploadResult({
          filename: contract.filename,
          status: 'existing',
          contract_id: contract.contract_id,
          model_used: contract.model_used
        });
      }
    }
  }, [selectedContractId, contracts, uploadResult]);

  // Unified Workflow Tracer (SOLID/DRY)
  const { pulseLabel } = useWorkflowTracer({
    isPolling: isProcessing,
    onComplete: () => {
      setIsProcessing(false);
    },
    onError: () => setIsProcessing(false)
  });

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    // Logic for successful upload
    if (result.contract_id) {
      addContract({
        contract_id: result.contract_id,
        filename: result.filename,
        upload_date: new Date().toISOString(),
        model_used: result.model_used,
        analysis_completed: false
      });
      // Sync global selection immediately
      setSelectedContract(result.contract_id);
    }
  };

  const handleUploadStart = () => {
    setUploadResult(null);
    setIsProcessing(true);
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
    <div className="space-y-6 pb-12 overflow-x-hidden">
      {/* Header Section */}
      <div className="relative">
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Next-Gen Intelligence</span>
            </div>
            <h1 className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              Contract <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">IntelligenceHub</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              Transform your legal operations with parallel multi-agent orchestration.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation and Content Hub (Tighter Integration) */}
      <div className="flex flex-col gap-0">
        {/* Browser-Style Navigation Tabs (Isolated & Logic-Safe) */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('report')}
          className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
            activeTab === 'report' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Intelligence Report
          {activeTab === 'report' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('strategic')}
          className={`relative flex items-center gap-2 text-sm font-bold transition-all p-[2px] pb-3 ${
            activeTab === 'strategic' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Strategic Insights
          {activeTab === 'strategic' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
          )}
        </button>
      </div>

        {/* Tab content conditional rendering */}
        {activeTab === 'report' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Unified Contract Upload Header (Flat Strip Design) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 py-0 border-b border-slate-200/60 dark:border-slate-800/60 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.4em]">Contract Upload</h2>
            </div>
            
            <div className="flex-1 w-full translate-y-0.5">
              <DocumentUpload
                variant="compact"
                onUploadComplete={handleUploadComplete}
                onUploadStart={handleUploadStart}
                modelSelection={selectedModel}
                currentStatus={analysisPulse || pulseLabel}
              />
            </div>

            <div className="shrink-0 flex items-center gap-4 py-2 px-1">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Model Strategy</span>
                <span className="text-[8px] font-bold text-blue-500/60 uppercase tracking-tighter">Enterprise Mode</span>
              </div>
              <select 
                value={selectedModel} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedModel(e.target.value as any)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest focus:outline-none cursor-pointer hover:text-blue-600 transition-colors border-none p-0"
              >
                {modelOptions.map((model: string) => (
                  <option key={model} value={model} className="bg-white dark:bg-slate-900">
                    {model.replace(/-/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

        {/* Autonomous Analysis Section (Zero Initialization) */}
        <div className="pt-0">
          <ContractIntelligence
            contractId={selectedContractId || uploadResult?.contract_id || null}
            filename={uploadResult?.filename}
            onAnalysisComplete={handleAnalysisComplete}
            onPulseUpdate={setAnalysisPulse}
          />
        </div>

        {/* Recent Contracts Table Section */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">Recent Historical Context</h2>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <RecentContractsTable 
                contracts={contracts} 
                onSelect={(id: string) => {
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
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 min-h-[400px]">
          <StrategicInsightsView />
          </div>
        )}
      </div>
    </div>
  );
};