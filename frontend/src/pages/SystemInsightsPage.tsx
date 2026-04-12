import React, { useState } from 'react';
import { Card } from '../components/shared/ui/card';
import { Badge } from '../components/shared/ui/badge';
import { SupervisorPage } from './SupervisorPage';
import { WorkflowsPage } from './WorkflowsPage';
import { HeartbeatInsights } from './HeartbeatInsights';
import { USPPage } from './USPPage';
import { cn } from '../lib/utils';
import { Brain, Zap, Target, Info, Activity } from 'lucide-react';

type InsightTab = 'supervisor' | 'workflow' | 'benefits';

export const SystemInsightsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InsightTab>('supervisor');

  const tabs = [
    { 
        id: 'supervisor' as InsightTab, 
        label: 'Supervisor', 
        icon: <Brain className="w-3.5 h-3.5" />, 
        description: 'Orchestration Core',
        color: 'blue'
    },
    { 
        id: 'workflow' as InsightTab, 
        label: 'Workflow', 
        icon: <Zap className="w-3.5 h-3.5" />, 
        description: 'Agent Coordination',
        color: 'orange'
    },
    { 
        id: 'benefits' as InsightTab, 
        label: 'Business Benefits', 
        icon: <Target className="w-3.5 h-3.5" />, 
        description: 'Unique Value Prop',
        color: 'green'
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'supervisor': return <SupervisorPage />;
      case 'workflow': return <WorkflowsPage />;
      case 'benefits': return <USPPage />;
      default: return <SupervisorPage />;
    }
  };

  const getActiveStyles = (id: InsightTab, color: string) => {
    if (activeTab !== id) return "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300";
    
    switch (color) {
        case 'blue': return "text-blue-600 dark:text-blue-400";
        case 'orange': return "text-orange-600 dark:text-orange-400";
        case 'purple': return "text-purple-600 dark:text-purple-400";
        case 'green': return "text-green-600 dark:text-green-400";
        default: return "text-blue-600 dark:text-blue-400";
    }
  };

  const getIndicatorColor = (color: string) => {
    switch (color) {
        case 'blue': return "bg-blue-600 dark:bg-blue-400";
        case 'orange': return "bg-orange-600 dark:bg-orange-400";
        case 'purple': return "bg-purple-600 dark:bg-purple-400";
        case 'green': return "bg-green-600 dark:bg-green-400";
        default: return "bg-blue-600 dark:bg-blue-400";
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section with Premium Typography */}
      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                <Info className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[-0.02em]">
                System <span className="text-blue-600 dark:text-blue-400">Insights</span>
            </h1>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-11">
            Real-time multi-agent observability hub
        </p>
      </div>

      {/* Tabs Navigation (Analysis Style) */}
      <div className="px-2">
          <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                  getActiveStyles(tab.id, tab.color)
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full transition-all duration-500",
                      getIndicatorColor(tab.color)
                  )} />
                )}
              </button>
            ))}
          </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[600px] px-2">
        <Card className="p-0 border-none bg-transparent shadow-none overflow-visible">
            {renderContent()}
        </Card>
      </div>
      
      {/* Footer System Status Badge */}
      <div className="flex justify-center pt-8 border-t border-slate-200 dark:border-slate-800 pb-12">
        <Badge variant="outline" className="px-4 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border-none text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Orchestration Mode: Autonomous Reasoning Enabled
        </Badge>
      </div>
    </div>
  );
};
