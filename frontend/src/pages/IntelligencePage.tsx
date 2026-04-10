import React, { useState, FC, useEffect } from 'react';
import { DocumentUpload } from '../components/features/contracts/DocumentUpload';
import { ContractIntelligence } from '../components/features/intelligence/ContractIntelligence';
import { RecentContractsTable } from '../components/features/intelligence/RecentContractsTable';
import { WorkflowStatus } from '../components/features/intelligence/AgentPulse';
import { Card } from '../components/shared/ui/card';
import { useContractHistory } from '../contexts/ContractHistoryContext';
import { ChevronDown, ChevronUp, FileText, Sparkles, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details?: string;
  model_used: string;
}

export const IntelligencePage: FC = () => {
  const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
  const AVAILABLE_MODELS_ENV = import.meta.env.VITE_AVAILABLE_MODELS || 'gemini-2.5-flash,gemini-1.5-pro,gpt-4o,sonnet-3.5';
  
  const modelOptions = AVAILABLE_MODELS_ENV.split(',').map((m: string) => m.trim());
  
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { contracts, addContract, updateContract, setSelectedContract } = useContractHistory();

  // Reset pulse when a new report is expanded (if results are already there)
  useEffect(() => {
    if (uploadResult && !isProcessing) {
      // Keep workflowStatus visible if it was recently completed
    }
  }, [uploadResult, isProcessing]);

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    setIsProcessing(false);
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
    setIsProcessing(true);
    setWorkflowStatus(null);
  };

  const handleWorkflowUpdate = (status: WorkflowStatus) => {
    setWorkflowStatus(status);
    // If we have executions, we are definitely processing
    if (status.agent_executions.length > 0) {
      const allDone = status.completed_agents + status.failed_agents === status.total_agents && status.total_agents > 0;
      if (allDone) {
        // Delay slightly to show "Completed" state
        setTimeout(() => setIsProcessing(false), 2000);
      } else {
        setIsProcessing(true);
      }
    }
  };

  const handleAnalysisComplete = (contractId: string, riskScore?: number, riskLevel?: string, results?: any) => {
    setIsProcessing(false);
    updateContract(contractId, {
      analysis_completed: true,
      risk_score: riskScore,
      risk_level: riskLevel,
      analysis_results: results
    });
  };

  const getPulseMessage = () => {
    if (!workflowStatus || workflowStatus.agent_executions.length === 0) return "";
    if (workflowStatus.failed_agents > 0) return "Pipeline Halted";
    
    const activeAgent = [...workflowStatus.agent_executions].reverse().find(e => e.status === 'processing');
    if (activeAgent) {
      if (activeAgent.agent_name.includes('Ingestion')) return "Loading File...";
      if (activeAgent.agent_name.includes('Architect')) return "Chunking & Graphing...";
      return `${activeAgent.agent_name} Active...`;
    }
    
    if (workflowStatus.completed_agents === workflowStatus.total_agents && workflowStatus.total_agents > 0) {
      return "Intelligence Synced";
    }
    
    return "Orchestrating Agents...";
  };

  return (
    <div className="space-y-10 pb-12 overflow-x-hidden">
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

          <div className="flex flex-col gap-8 items-center lg:items-start max-w-3xl">
            {/* Integrated Upload & Pulse Hub */}
            <div className="w-full space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 italic">Agentic Ingestion</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Model</label>
                    <select 
                      value={selectedModel} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedModel(e.target.value as any)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer hover:border-blue-300"
                    >
                      {modelOptions.map((model: string) => (
                        <option key={model} value={model}>
                          {model.replace(/-/g, ' ').toUpperCase()}
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
                  modelSelection={selectedModel}
                  currentStatus={getPulseMessage()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

      {/* Collapsible Analysis Results Section */}
      {uploadResult?.contract_id && (
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          {/* Section Header - Interactive Toggle */}
          <div 
            onClick={() => setIsReportExpanded(!isReportExpanded)}
            className="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Intelligence Report</h2>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {uploadResult.filename}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 px-6 py-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                {isReportExpanded ? 'Close Report' : 'Open Analysis'}
              </span>
              {isReportExpanded ? (
                <ChevronUp className="w-5 h-5 opacity-70" />
              ) : (
                <ChevronDown className="w-5 h-5 opacity-70" />
              )}
            </div>
          </div>

          {/* Animated Collapsible Container */}
          <div className={cn(
            "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
            isReportExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="p-10 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/20">
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
  );
};