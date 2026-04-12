import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/ui/card';
import { Badge } from '../components/shared/ui/badge';
import { ArrowRight, Brain, Shield, CheckCircle, AlertTriangle, Zap, Users, FileText, Bot } from 'lucide-react';

export const SupervisorPage: React.FC = () => {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());

  const toggleFlow = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId);
    } else {
      newExpanded.add(flowId);
    }
    setExpandedFlows(newExpanded);
  };

  const coordinationFlows = [
    {
      id: 'initialization',
      title: 'Initialization Flow',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-600',
      description: 'How supervisor initializes and registers agents',
      steps: [
        { name: 'SupervisorFactory', description: 'Creates supervisor instance', icon: <Brain className="w-5 h-5" /> },
        { name: 'AgentFactory', description: 'Creates adapter instances', icon: <Zap className="w-5 h-5" /> },
        { name: 'AgentRegistry', description: 'Registers all agents', icon: <Users className="w-5 h-5" /> },
        { name: 'QualityManager', description: 'Initializes validation strategies', icon: <Shield className="w-5 h-5" /> },
        { name: 'Ready State', description: 'Supervisor ready for coordination', icon: <CheckCircle className="w-5 h-5" /> }
      ]
    },
    {
      id: 'workflow_execution',
      title: 'Workflow Execution Flow',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-blue-600',
      description: 'Step-by-step agent coordination process',
      steps: [
        { name: 'API Request', description: 'POST /api/supervisor/workflow/execute', icon: <FileText className="w-5 h-5" /> },
        { name: 'PDF Processing', description: 'Extract text and metadata', icon: <FileText className="w-5 h-5" /> },
        { name: 'Clause Extraction', description: 'Extract 41 CUAD clause types', icon: <Bot className="w-5 h-5" /> },
        { name: 'Risk Assessment', description: 'Calculate risk scores', icon: <AlertTriangle className="w-5 h-5" /> },
        { name: 'Quality Validation', description: 'Validate each step output', icon: <Shield className="w-5 h-5" /> },
        { name: 'Result Aggregation', description: 'Combine all agent results', icon: <CheckCircle className="w-5 h-5" /> }
      ]
    },
    {
      id: 'error_handling',
      title: 'Error Handling Flow',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-red-600',
      description: 'How supervisor handles agent failures',
      steps: [
        { name: 'Agent Failure', description: 'Agent execution fails', icon: <AlertTriangle className="w-5 h-5" /> },
        { name: 'Circuit Breaker', description: 'Detects failure pattern', icon: <Shield className="w-5 h-5" /> },
        { name: 'Retry Manager', description: 'Exponential backoff retry', icon: <Zap className="w-5 h-5" /> },
        { name: 'Recovery Strategy', description: 'Retry/Switch/Degrade/Escalate', icon: <Brain className="w-5 h-5" /> },
        { name: 'Fallback Result', description: 'Graceful degradation', icon: <CheckCircle className="w-5 h-5" /> }
      ]
    },
    {
      id: 'quality_gates',
      title: 'Quality Gate Flow',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-600',
      description: 'Quality validation between agent executions',
      steps: [
        { name: 'Agent Completion', description: 'Agent finishes execution', icon: <Bot className="w-5 h-5" /> },
        { name: 'Strategy Selection', description: 'Get validation strategy', icon: <Brain className="w-5 h-5" /> },
        { name: 'Output Validation', description: 'Validate structure & content', icon: <Shield className="w-5 h-5" /> },
        { name: 'Quality Scoring', description: 'Calculate A-F grade', icon: <CheckCircle className="w-5 h-5" /> },
        { name: 'Gate Decision', description: 'Pass/Fail/Retry decision', icon: <AlertTriangle className="w-5 h-5" /> }
      ]
    }
  ];

  const coordinationBenefits = [
    {
      title: 'Centralized Control',
      description: 'Single point for workflow management and orchestration',
      icon: <Brain className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50'
    },
    {
      title: 'Error Recovery',
      description: 'Automatic retry and fallback strategies for resilience',
      icon: <Shield className="w-5 h-5 text-red-600" />,
      color: 'border-red-200 bg-red-50'
    },
    {
      title: 'Quality Assurance',
      description: 'Validation gates between agents ensure output quality',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      color: 'border-green-200 bg-green-50'
    },
    {
      title: 'Shared Context',
      description: 'Agents access previous results through workflow memory',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50'
    },
    {
      title: 'Circuit Protection',
      description: 'Prevents cascade failures with intelligent circuit breakers',
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      color: 'border-yellow-200 bg-yellow-50'
    },
    {
      title: 'Audit Trail',
      description: 'Complete workflow tracking and logging for compliance',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tight">
          Supervisor <span className="text-blue-600 dark:text-blue-400">Agent</span>
        </h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-2xl mx-auto uppercase tracking-[0.15em]">
          Enterprise-grade coordinator orchestrating multi-agent workflows with intelligent recovery & validation strategies.
        </p>
      </div>

      {/* Coordination Flows */}
      <div className="space-y-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[-0.01em] ml-1 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Coordination Flows
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {coordinationFlows.map((flow) => (
            <Card 
              key={flow.id}
              className={`cursor-pointer transition-all duration-500 overflow-hidden bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.01] ${
                expandedFlows.has(flow.id) ? 'ring-2 ring-blue-500/50' : ''
              }`}
              onClick={() => toggleFlow(flow.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${flow.color} text-white shadow-lg`}>
                    {flow.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight">{flow.title}</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{flow.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              {expandedFlows.has(flow.id) && (
                <CardContent className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    {flow.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                            {step.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-[11px] text-slate-800 dark:text-slate-100 uppercase tracking-tight">{step.name}</h4>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{step.description}</p>
                          </div>
                        </div>
                        {idx < flow.steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Orchestration Snapshot
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Coordination Benefits */}
      <div className="space-y-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[-0.01em] ml-1 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-purple-600 rounded-full" />
            System Benefits
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coordinationBenefits.map((benefit, idx) => (
            <Card key={idx} className={`border ${benefit.color} bg-white/50 dark:bg-slate-900/50 hover:shadow-lg transition-all duration-300 group`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-[11px] text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">{benefit.title}</h3>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight opacity-80 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Architecture Overview */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
            <Brain className="w-5 h-5 text-purple-600" />
            Architecture Blueprint
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
              <h4 className="font-black text-[11px] mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-3 h-3 text-blue-500" /> Design Patterns
              </h4>
              <div className="space-y-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Template Method (BaseAdapter)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Strategy Pattern (Validation)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Factory Pattern (Agent creation)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Circuit Breaker (Failure protection)</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
              <h4 className="font-black text-[11px] mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield className="w-3 h-3 text-purple-500" /> Agentic AI Patterns
              </h4>
              <div className="space-y-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Shared Context (Workflow memory)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Agent Communication (Message bus)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Quality Gates (Inter-agent validation)</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Dynamic Discovery (Registry pattern)</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Badge variant="outline" className="border-none bg-slate-200/50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 py-2 px-6">
              Engineering Governance: Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};