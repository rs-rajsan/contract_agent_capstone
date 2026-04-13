import { Eye, Database, Users, ShieldCheck, AlertCircle, Lock, Info } from 'lucide-react';

export type RoleCategory = 'business' | 'legal' | 'technical';

export interface RoleDefinition {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  desc: string;
  perms: string[];
}

export interface CategoryDefinition {
  title: string;
  description: string;
  roles: RoleDefinition[];
}

export const ROLE_HIERARCHY: Record<RoleCategory, CategoryDefinition> = {
  business: {
    title: 'Business Tier',
    description: 'Focused on strategic ROI, operational throughput, and high-level enterprise oversight.',
    roles: [
      {
        id: 'executive',
        name: 'Executive Oversight',
        icon: Eye,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        desc: 'High-level oversight for the C-Suite and strategic leadership.',
        perms: ['Strategic ROI Dashboards', 'TCV Trend Analysis', 'Aggregate Risk Profiles', 'Read-Only View']
      },
      {
        id: 'ops_lead',
        name: 'Operations Lead',
        icon: Database,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        desc: 'Management of departmental processing and pipeline priorities.',
        perms: ['Priority Orchestration', 'SLA Monitoring', 'Departmental Approval', 'Volume Forecasting']
      }
    ]
  },
  legal: {
    title: 'Legal & Analysis',
    description: 'The core intelligence layer responsible for contract ingestion, compliance, and auditing.',
    roles: [
      {
        id: 'analyst',
        name: 'Analyst',
        icon: Users,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        desc: 'Primary operator for document processing and intelligence consumption.',
        perms: ['Document Ingestion', 'Report Generation', 'Strategic Insights', 'Chat Access']
      },
      {
        id: 'auditor',
        name: 'Auditor',
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        desc: 'Compliance oversight and continuous performance monitoring.',
        perms: ['Immutable Audit Logs', 'System Health Check', 'Analytics Export', 'Performance Review']
      },
      {
        id: 'risk_manager',
        name: 'Risk Manager',
        icon: AlertCircle,
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        desc: 'Regulatory policy enforcement and red-flag configuration.',
        perms: ['Compliance Policy Edit', 'Red-Flag Sentinel', 'Risk Baseline Tuning', 'Variance Alerts']
      },
      {
        id: 'hitl_supervisor',
        name: 'HITL Supervisor',
        icon: Lock,
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-500/10',
        desc: 'Expert-level reasoning validation and quality control.',
        perms: ['Review Queue Access', 'Hallucination Correction', 'Model Logic Validation', 'Final Ingestion Sign-off']
      }
    ]
  },
  technical: {
    title: 'Technical Ops',
    description: 'Infrastructure and AI engineering responsible for model performance and system stability.',
    roles: [
      {
        id: 'admin',
        name: 'Admin',
        icon: ShieldCheck,
        color: 'text-slate-900',
        bg: 'bg-slate-100 dark:bg-slate-800',
        desc: 'Full system orchestration and account management authority.',
        perms: ['User Provisioning', 'Infrastructure Control', 'Full Role Definition', 'Config Access']
      },
      {
        id: 'ba',
        name: 'Business Analyst',
        icon: Info,
        color: 'text-cyan-500',
        bg: 'bg-cyan-50 dark:bg-cyan-500/10',
        desc: 'Mapping business requirements to agentic logic patterns.',
        perms: ['Logic Requirement Definition', 'Pattern Mapping', 'UAT Reporting', 'Feature Specs']
      },
      {
        id: 'ai_dev',
        name: 'AI Developer',
        icon: Database,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 dark:bg-indigo-600/10',
        desc: 'Agent graph maintenance and model performance tuning.',
        perms: ['Model Selection', 'Prompt Engineering', 'Trace Debugging', 'Webhook Integration']
      },
      {
        id: 'qa',
        name: 'QA Engineer',
        icon: ShieldCheck,
        color: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-500/10',
        desc: 'Regression testing and AI accuracy verification.',
        perms: ['Benchmark Execution', 'Accuracy Validation', 'Hallucination Tracking', 'Regression Testing']
      }
    ]
  }
};

export const getAllRoles = () => {
  return Object.values(ROLE_HIERARCHY).flatMap(cat => cat.roles);
};

export const getRoleById = (id: string) => {
  return getAllRoles().find(role => role.id === id);
};
