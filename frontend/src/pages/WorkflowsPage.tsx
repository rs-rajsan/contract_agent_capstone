import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/ui/card';
import { Badge } from '../components/shared/ui/badge';
import { ArrowRight } from 'lucide-react';
import { workflows } from '../data/workflows.tsx';
import { getWorkflowBadgeText, getStepTextColor } from '../utils/documentation';

export const WorkflowsPage: React.FC = () => {
  const [activeWorkflows, setActiveWorkflows] = useState<Set<string>>(new Set());

  const toggleWorkflow = (key: string) => {
    const newActiveWorkflows = new Set(activeWorkflows);
    if (newActiveWorkflows.has(key)) {
      newActiveWorkflows.delete(key);
    } else {
      newActiveWorkflows.add(key);
    }
    setActiveWorkflows(newActiveWorkflows);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tight">
          AI <span className="text-blue-600 dark:text-blue-400">Workflows</span>
        </h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-2xl mx-auto uppercase tracking-[0.15em]">
          Multi-agent orchestration paths for contract processing and autonomous analysis.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(workflows).map(([key, workflow]) => (
          <Card 
            key={key} 
            className={`overflow-hidden cursor-pointer transition-all duration-500 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.005] ${
              activeWorkflows.has(key) ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-md'
            }`}
            onClick={() => toggleWorkflow(key)}
          >
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg">
                    {workflow.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight">{workflow.title}</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{workflow.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200">
                  {activeWorkflows.has(key) ? 'Active' : 'Click to Visualize'}
                </Badge>
              </div>
            </CardHeader>
            {activeWorkflows.has(key) && (
              <CardContent className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between overflow-x-auto pb-4 gap-6">
                  {workflow.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex flex-col items-center text-center min-w-[140px] group">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-4 group-hover:bg-blue-500/10 transition-colors ring-1 ring-slate-100 dark:ring-slate-700">
                          {step.icon}
                        </div>
                        <h4 className={`text-[11px] font-black mb-1 uppercase tracking-tight ${getStepTextColor(step)}`}>
                          {step.agent}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-3 line-clamp-2">{step.description}</p>
                        <div className="text-[8px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-full border border-blue-500/10 uppercase tracking-widest">
                          {step.tech}
                        </div>
                      </div>
                      {idx < workflow.steps.length - 1 && (
                        <div className="flex-1 flex justify-center">
                            <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-2 animate-pulse" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                  <Badge variant="secondary" className="px-6 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-none">
                    {getWorkflowBadgeText(key)}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};