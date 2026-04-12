import React, { useState } from 'react';
import { useContractHistory } from '../../../contexts/ContractHistoryContext';
import { useWorkflowTracer } from '../../../hooks/useWorkflowTracer';
import { cn } from '../../../lib/utils';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Clock, Brain, XCircle, FileText, AlertTriangle, Shield, Wifi, RefreshCw, Sparkles } from 'lucide-react';
import { DetailModal } from './DetailModal';
import { apiRequest } from '../../../services/apiClient';
import { ClausesDetail } from './ClausesDetail';
import { ViolationsDetail } from './ViolationsDetail';
import { RiskDetail } from './RiskDetail';

interface ContractClause {
  clause_type: string;
  content: string;
  risk_level: string;
  confidence_score: number;
  location: string;
}

interface PolicyViolation {
  clause_type: string;
  issue: string;
  severity: string;
  suggested_fix: string;
  clause_content: string;
}

interface RiskAssessment {
  overall_risk_score: number;
  risk_level: string;
  critical_issues: string[];
  recommendations: string[];
}

interface IntelligenceResults {
  clauses: ContractClause[];
  violations: PolicyViolation[];
  risk_assessment: RiskAssessment;
  redlines: any[];
  validation_result?: {
    confidence_score: number;
    reflections: string[];
    integrity_checks?: Record<string, boolean>;
  };
}

interface ContractIntelligenceProps {
  contractId: string | null;
  filename?: string;
  model?: string;
  onAnalysisComplete?: (contractId: string, riskScore?: number, riskLevel?: string, results?: any) => void;
  onPulseUpdate?: (label: string | null) => void;
}

export const ContractIntelligence: React.FC<ContractIntelligenceProps> = ({ 
  contractId, 
  filename,
  model = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash',
  onAnalysisComplete,
  onPulseUpdate
}) => {
  const { contracts } = useContractHistory();
  const [results, setResults] = useState<IntelligenceResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'risk' | 'violations' | 'clauses'>('risk');

  // Unified Workflow Tracer (SOLID/DRY)
  const { pulseLabel } = useWorkflowTracer({
    isPolling: loading,
    onError: (msg) => setError(msg)
  });

  // Bubble up pulse status to parent header
  React.useEffect(() => {
    if (loading && pulseLabel) {
      onPulseUpdate?.(pulseLabel);
    } else if (!loading) {
      onPulseUpdate?.(null);
    }
  }, [pulseLabel, loading, onPulseUpdate]);

  // Automatic Analysis Orchestration (Agentic Flow)
  React.useEffect(() => {
    // Reset internal state for fresh context
    setResults(null);
    setError(null);
    setNetworkError(false);
    
    if (contractId) {
      // Persistence Check (Cache-First)
      const existingContract = contracts.find(c => c.contract_id === contractId);
      if (existingContract?.analysis_completed && existingContract.analysis_results) {
        setResults(existingContract.analysis_results);
        setLoading(false);
      } else {
        analyzeContract();
      }
    }
  }, [contractId, model, contracts]);

  const analyzeContract = async () => {
    setLoading(true);
    setError(null);
    setNetworkError(false);
    
    try {
      const data = await apiRequest<any>(`/api/intelligence/contracts/${contractId}/analyze?model=${model}`, {
        method: 'POST',
      });
      
      if (!data.results) {
        throw new Error('No analysis results returned. The contract may be invalid or corrupted.');
      }
      
      setResults(data.results);
      
      // Report analysis completion with full results
      if (data.results?.risk_assessment && contractId) {
        onAnalysisComplete?.(contractId, data.results.risk_assessment.overall_risk_score, data.results.risk_assessment.risk_level, data.results);
      }
      
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setNetworkError(true);
        setError('Network connection failed. Please check your internet connection.');
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getViolationSeverityColor = (violations: PolicyViolation[]) => {
    if (!violations || violations.length === 0) return 'text-slate-600';
    
    const hasCritical = violations.some(v => v.severity.toUpperCase() === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity.toUpperCase() === 'HIGH');
    
    if (hasCritical) return 'text-red-600';
    if (hasHigh) return 'text-orange-600';
    return 'text-slate-600';
  };

  const renderEmptyResults = () => (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="pt-6 text-center py-12">
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">No Analysis Results</h3>
        <p className="text-sm text-slate-500 mb-4">
          The contract analysis returned no results. This may indicate the document is not a valid contract.
        </p>
        <Button variant="outline" onClick={analyzeContract}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Analysis
        </Button>
      </CardContent>
    </Card>
  );

  const renderNetworkError = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6 text-center py-12">
        <Wifi className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-600 mb-2">Connection Failed</h3>
        <p className="text-sm text-red-700 mb-4">
          Unable to connect to the analysis service. Please check your connection and try again.
        </p>
        <Button variant="outline" onClick={analyzeContract} className="border-red-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </CardContent>
    </Card>
  );

  const hasPartialResults = (results: IntelligenceResults) => {
    return results && (
      !results.clauses || results.clauses.length === 0 ||
      !results.violations || 
      !results.risk_assessment
    );
  };

  return (
    <div className="space-y-6 pt-0">
      {/* Contextual Header (High Density) */}
      {/* Contextual Header (Left Aligned) */}
      <div className="flex flex-col gap-1 mb-2">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em]">
          Insights of {filename || 'New Contract'}
        </h3>
        <p className="text-[10px] text-slate-500 font-medium">Detailed intelligence metrics and agentic findings</p>
      </div>
      {/* Analysis Status Overlay (Pulse) */}
      {loading && (
        <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-indigo-700 animate-in fade-in zoom-in-95">
          <div className="relative">
            <Clock className="h-5 w-5 animate-spin" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-indigo-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs">Deep Intelligence Analysis</span>
            <span className="text-[10px] opacity-80">{pulseLabel || 'Orchestrating multi-agent pipeline...'}</span>
          </div>
        </div>
      )}

      {/* Primary Results Display (Risk, Violations, Clauses) */}
      <div className="grid grid-cols-3 gap-4 px-1 py-1">
        <Card 
          className={cn(
            "border-slate-200 cursor-pointer transition-all duration-300 relative",
            activeDetailTab === 'risk' ? "ring-2 ring-blue-500 shadow-lg border-transparent" : "hover:border-blue-300 hover:shadow-md"
          )}
          onClick={() => setActiveDetailTab('risk')}
        >
          {activeDetailTab === 'risk' && <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-tr-xl rounded-bl-xl flex items-center justify-center animate-in slide-in-from-top-full duration-300"><Clock className="w-4 h-4" /></div>}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {results?.risk_assessment?.overall_risk_score || 0}/100
            </div>
            <Badge className={getRiskColor(results?.risk_assessment?.risk_level || 'UNKNOWN')}>
              {results?.risk_assessment?.risk_level || (loading ? 'ANALYZING...' : 'INITIALIZED')}
            </Badge>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "border-slate-200 cursor-pointer transition-all duration-300 relative",
            activeDetailTab === 'violations' ? "ring-2 ring-orange-500 shadow-lg border-transparent" : "hover:border-orange-300 hover:shadow-md"
          )}
          onClick={() => setActiveDetailTab('violations')}
        >
          {activeDetailTab === 'violations' && <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-tr-xl rounded-bl-xl flex items-center justify-center animate-in slide-in-from-top-full duration-300"><AlertTriangle className="w-4 h-4" /></div>}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getViolationSeverityColor(results?.violations || [])}`}>
              {results?.violations?.length || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium italic">Active findings</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "border-slate-200 cursor-pointer transition-all duration-300 relative",
            activeDetailTab === 'clauses' ? "ring-2 ring-green-500 shadow-lg border-transparent" : "hover:border-green-300 hover:shadow-md"
          )}
          onClick={() => setActiveDetailTab('clauses')}
        >
          {activeDetailTab === 'clauses' && <div className="absolute top-0 right-0 w-8 h-8 bg-green-500 text-white rounded-tr-xl rounded-bl-xl flex items-center justify-center animate-in slide-in-from-top-full duration-300"><FileText className="w-4 h-4" /></div>}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Clauses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {results?.clauses?.length || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium italic">Entities identified</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-2">
        {/* Navigation Tabs (Underline Style) */}
        <div className="flex items-center gap-8 border-b border-slate-200/60 dark:border-slate-800/60">
          <button 
            onClick={() => setActiveDetailTab('risk')}
            className={cn(
              "relative px-1 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeDetailTab === 'risk' ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Risk Detail
            {activeDetailTab === 'risk' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveDetailTab('violations')}
            className={cn(
              "relative px-1 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeDetailTab === 'violations' ? "text-orange-600 dark:text-orange-400" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Violations
            {activeDetailTab === 'violations' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-600 dark:bg-orange-400 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveDetailTab('clauses')}
            className={cn(
              "relative px-1 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeDetailTab === 'clauses' ? "text-green-600 dark:text-green-400" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Clauses
            {activeDetailTab === 'clauses' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-600 dark:bg-green-400 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab Content Area (Native Layout) */}
        <div className="pt-4 min-h-[400px]">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeDetailTab === 'risk' && (
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white"><Shield className="w-5 h-5" /></div>
                  Comprehensive Risk Assessment
                </h3>
                {results?.risk_assessment ? (
                  <RiskDetail riskAssessment={results.risk_assessment} contractId={contractId ?? undefined} />
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-400">Waiting for risk orchestration...</p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'violations' && (
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-orange-600 rounded-lg text-white"><AlertTriangle className="w-5 h-5" /></div>
                  Policy Violations Inventory
                </h3>
                {results?.violations && results.violations.length > 0 ? (
                  <ViolationsDetail violations={results.violations} contractId={contractId ?? undefined} />
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-400">No violations detected currently.</p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'clauses' && (
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg text-white"><FileText className="w-5 h-5" /></div>
                  Structural Clause Analysis
                </h3>
                {results?.clauses && results.clauses.length > 0 ? (
                  <ClausesDetail clauses={results.clauses} contractId={contractId ?? undefined} />
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-400">No structural clauses extracted yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Error State */}
      {networkError && renderNetworkError()}

      {/* Error Display */}
      {error && !networkError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 mb-3">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={analyzeContract}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50/50 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-blue-700">
                <div className="relative">
                    <Clock className="h-5 w-5 animate-spin" />
                    <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-blue-400 animate-pulse" />
                </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Agent Pulse</span>
                <span className="text-xs opacity-80">{pulseLabel || 'Initializing agentic pipeline...'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty Results Fallback */}
      {!loading && !error && results && 
       (!results.clauses || results.clauses.length === 0) && 
       (!results.violations || results.violations.length === 0) && 
       !results.risk_assessment && renderEmptyResults()}

      {/* Partial Results Warning */}
      {results && hasPartialResults(results) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Partial Analysis Results</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Some analysis components may have failed. Results shown are incomplete.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Advanced Insights (Appear only after analysis) */}
      {results && results.risk_assessment && (
        <div className="space-y-6">
          {/* Auditor Confidence & Reflections (Agentic Pattern) */}
          {results.validation_result && (
            <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="h-24 w-24 text-indigo-500 rotate-12" />
              </div>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Auditor Self-Reflection</h4>
                      <p className="text-xs text-slate-500">Autonomous integrity check and pattern validation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Analysis Confidence</span>
                        <span className={`text-xl font-black ${
                            results.validation_result.confidence_score > 0.8 ? 'text-emerald-600' : 
                            results.validation_result.confidence_score > 0.5 ? 'text-orange-600' : 'text-rose-600'
                        }`}>
                            {Math.round(results.validation_result.confidence_score * 100)}%
                        </span>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />
                    <Badge className={`${
                        results.validation_result.confidence_score > 0.8 ? 'bg-emerald-500' : 'bg-orange-500'
                    } text-white border-none shadow-sm`}>
                        {results.validation_result.confidence_score > 0.8 ? 'HIGH INTEGRITY' : 'VERIFICATION NEEDED'}
                    </Badge>
                  </div>
                </div>

                {results.validation_result.reflections && results.validation_result.reflections.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-slate-200/50">
                     <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-2">Agentic Reflections</span>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {results.validation_result.reflections.map((reflection, i) => (
                           <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 leading-tight bg-white/40 p-2 rounded-lg border border-white/60">
                              <div className="mt-1 h-1 w-1 rounded-full bg-indigo-400 flex-shrink-0" />
                              {reflection}
                           </li>
                        ))}
                     </ul>
                   </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Critical Issues Preview */}
          {results.risk_assessment?.critical_issues?.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Critical Issues Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 mb-3">
                  {results.risk_assessment.critical_issues.length} critical issues require immediate attention
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setActiveDetailTab('risk')}
                >
                  Review Critical Issues
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}


    </div>
  );
};