import { useState, FC } from 'react';
import { DocumentUpload } from '../components/features/contracts/DocumentUpload';
import { ContractIntelligence } from '../components/features/intelligence/ContractIntelligence';
import { AgentWorkflowTracker } from '../components/features/agents/AgentWorkflowTracker';
import { RecentContractsTable } from '../components/features/intelligence/RecentContractsTable';
import { Card } from '../components/shared/ui/card';
import { useContractHistory } from '../contexts/ContractHistoryContext';

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details?: string;
  model_used: string;
}

export const IntelligencePage: FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const { contracts, addContract, updateContract, setSelectedContract } = useContractHistory();

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);

    // Add to contract history
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
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Contract Intelligence Hub</h1>
        <p className="text-lg text-slate-500 font-medium">
          Analyze and manage your contracts with AI-driven insights.
        </p>
      </div>


      {/* Featured Upload Section */}
      <div className="w-full">
        <DocumentUpload
          onUploadComplete={handleUploadComplete}
          onWorkflowUpdate={handleWorkflowUpdate}
          onUploadStart={handleUploadStart}
        />
      </div>

      {/* Analysis Results View (Conditional Overlay/Section) */}
      {uploadResult?.contract_id && (
        <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-slate-800">Intelligence Analysis</h2>
              </div>
              <button 
                onClick={() => setUploadResult(null)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to Overview
              </button>
            </div>

            {/* Workflow Tracker */}
            {workflowStatus && workflowStatus.agent_executions?.length > 0 && (
              <div className="mb-8 border-b border-slate-100 pb-8">
                <AgentWorkflowTracker
                  workflowStatus={{
                    ...workflowStatus,
                    agent_executions: workflowStatus.agent_executions.filter((e: any) => e.agent_name !== 'PDF Processing Agent')
                  }}
                />
              </div>
            )}

            <ContractIntelligence
              contractId={uploadResult.contract_id}
              onWorkflowUpdate={handleWorkflowUpdate}
              onAnalysisComplete={handleAnalysisComplete}
            />
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
              setUploadResult({
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