import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/ui/card';
import { Badge } from '../components/shared/ui/badge';
import { ArrowRight, Brain, Shield, CheckCircle, Zap, Users, FileText, Bot, Target, Star, TrendingUp } from 'lucide-react';

export const USPPage: React.FC = () => {
  const [expandedUSPs, setExpandedUSPs] = useState<Set<string>>(new Set());

  const toggleUSP = (uspId: string) => {
    const newExpanded = new Set(expandedUSPs);
    if (newExpanded.has(uspId)) {
      newExpanded.delete(uspId);
    } else {
      newExpanded.add(uspId);
    }
    setExpandedUSPs(newExpanded);
  };

  const uniqueSellingPoints = [
    {
      id: 'multi_level_search',
      title: 'Multi-Level Semantic Search',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-blue-600',
      description: 'Industry-first 4-level hierarchical search across documents, sections, clauses, and relationships',
      differentiators: [
        { name: 'Document-Level Search', description: 'Full contract semantic matching', icon: <FileText className="w-5 h-5" /> },
        { name: 'Section-Level Search', description: 'Granular section-based retrieval', icon: <Bot className="w-5 h-5" /> },
        { name: 'Clause-Level Search', description: '41 CUAD clause types with embeddings', icon: <CheckCircle className="w-5 h-5" /> },
        { name: 'Relationship-Level Search', description: 'Party and entity relationship mapping', icon: <Users className="w-5 h-5" /> }
      ],
      competitors: 'Most competitors offer only document-level search without granular clause or relationship analysis'
    },

    {
      id: 'autonomous_planning',
      title: 'Autonomous Planning & Reasoning',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-green-600',
      description: 'Self-adapting AI that analyzes query complexity and creates optimal execution strategies',
      differentiators: [
        { name: 'Query Complexity Analysis', description: 'Automatic strategy selection based on requirements', icon: <Brain className="w-5 h-5" /> },
        { name: 'Dynamic Workflow Construction', description: 'LangGraph-based adaptive execution paths', icon: <Zap className="w-5 h-5" /> },
        { name: 'Self-Reflection & Learning', description: 'Feedback adaptation for continuous improvement', icon: <TrendingUp className="w-5 h-5" /> },
        { name: 'Multi-Strategy Execution', description: 'Simple/Complex/Risk/Compliance-focused approaches', icon: <Target className="w-5 h-5" /> }
      ],
      competitors: 'Most solutions use static workflows without intelligent planning or self-adaptation capabilities'
    },
    {
      id: 'cuad_integration',
      title: 'Complete CUAD Dataset Integration',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-orange-600',
      description: 'Full implementation of 41 CUAD clause types with confidence scoring and position tracking',
      differentiators: [
        { name: '41 CUAD Clause Types', description: 'Complete coverage of legal contract elements', icon: <CheckCircle className="w-5 h-5" /> },
        { name: 'Confidence Scoring', description: 'Reliability metrics for each extracted clause', icon: <Star className="w-5 h-5" /> },
        { name: 'Position Tracking', description: 'Source location and context preservation', icon: <Target className="w-5 h-5" /> },
        { name: 'Hierarchical Embeddings', description: 'Multi-level semantic representations', icon: <Zap className="w-5 h-5" /> }
      ],
      competitors: 'Competitors typically support 10-15 clause types without comprehensive CUAD integration'
    },

    {
      id: 'graph_database',
      title: 'Graph Database Intelligence',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-teal-600',
      description: 'Native graph relationships unlock contract insights impossible with traditional databases',
      differentiators: [
        { name: 'Relationship Discovery', description: 'Find connected contracts, parties, and clause patterns', icon: <Users className="w-5 h-5" /> },
        { name: 'Contract Portfolio Analysis', description: 'Cross-contract risk aggregation and trend analysis', icon: <TrendingUp className="w-5 h-5" /> },
        { name: 'Precedent Lookup', description: 'Similar clause identification across contract history', icon: <Target className="w-5 h-5" /> },
        { name: 'Entity Relationship Mapping', description: 'Party networks, subsidiary connections, vendor relationships', icon: <Brain className="w-5 h-5" /> }
      ],
      competitors: 'Competitors use flat databases missing relationship intelligence and cross-contract insights'
    },

  ];

  const competitiveAdvantages = [
    {
      title: '80% Faster Contract Review',
      description: 'Automated analysis reduces manual review time',
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      color: 'border-yellow-200 bg-yellow-50'
    },
    {
      title: 'Cross-Contract Risk Intelligence',
      description: 'Portfolio-level risk aggregation and insights',
      icon: <Users className="w-5 h-5 text-teal-600" />,
      color: 'border-teal-200 bg-teal-50'
    },
    {
      title: '95% Risk Detection Accuracy',
      description: 'AI-powered identification of contract risks',
      icon: <Target className="w-5 h-5 text-red-600" />,
      color: 'border-red-200 bg-red-50'
    },
    {
      title: 'Complete Legal Compliance',
      description: '41 CUAD clause types with audit trails',
      icon: <Shield className="w-5 h-5 text-green-600" />,
      color: 'border-green-200 bg-green-50'
    },
    {
      title: 'Relationship Discovery',
      description: 'Find connected parties and contract patterns',
      icon: <Brain className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50'
    },
    {
      title: 'Enterprise Reliability',
      description: '99.9% uptime with circuit breaker protection',
      icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50'
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tight">
          Business <span className="text-blue-600 dark:text-blue-400">Benefits</span>
        </h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-2xl mx-auto uppercase tracking-[0.15em]">
          Discover the unique value proposition of our Contract Intelligence Agent through advanced AI architecture and enterprise reliability.
        </p>
      </div>

      {/* Unique Selling Points */}
      <div className="space-y-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[-0.01em] ml-1 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Core Differentiators
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {uniqueSellingPoints.map((usp) => (
            <Card 
              key={usp.id}
              className={`cursor-pointer transition-all duration-500 overflow-hidden bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.01] ${
                expandedUSPs.has(usp.id) ? 'ring-2 ring-blue-500/50' : ''
              }`}
              onClick={() => toggleUSP(usp.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${usp.color} text-white shadow-lg`}>
                    {usp.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight">{usp.title}</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{usp.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              {expandedUSPs.has(usp.id) && (
                <CardContent className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[11px] font-black mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em]">Key Capabilities</h4>
                      <div className="space-y-4">
                        {usp.differentiators.map((diff, idx) => (
                          <div key={idx} className="flex items-center gap-4 group">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                                {diff.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="font-black text-[11px] text-slate-800 dark:text-slate-100 uppercase tracking-tight">{diff.name}</h5>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-relaxed">{diff.description}</p>
                              </div>
                            </div>
                            {idx < usp.differentiators.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
                      <h5 className="font-black text-[10px] text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-[0.1em] flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-500" /> Competitive Advantage
                      </h5>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-relaxed">{usp.competitors}</p>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-none">
                        Strategy Optimized: High Yield
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="space-y-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[-0.01em] ml-1 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-green-600 rounded-full" />
            Market Value Proposition
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitiveAdvantages.map((advantage, idx) => (
            <Card key={idx} className={`border ${advantage.color} bg-white/50 dark:bg-slate-900/50 hover:shadow-lg transition-all duration-300 group`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 group-hover:scale-110 transition-transform duration-300">
                    {advantage.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-[11px] text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">{advantage.title}</h3>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight opacity-80 leading-relaxed">{advantage.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Position */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
            <Target className="w-5 h-5 text-green-600" />
            ROI & Business Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
              <h4 className="font-black text-[11px] mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-2">
                <Star className="w-3 h-3 text-blue-500" /> Performance Gains
              </h4>
              <div className="space-y-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> 80% reduction in review time</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Cross-contract risk aggregation</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> 95% accuracy in risk detection</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Portfolio relationship discovery</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
              <h4 className="font-black text-[11px] mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-500" /> Strategic ROI
              </h4>
              <div className="space-y-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full" /> 80% legal review cost savings</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full" /> Proactive risk prevention</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full" /> Accelerated deal closure timelines</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full" /> Optimized portfolio performance</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Badge variant="outline" className="border-none bg-slate-200/50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 py-2 px-6">
              Value Proposition: Quantified
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};