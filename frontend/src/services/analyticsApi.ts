const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface KPISummary {
  hallucination_rate: string;
  total_hallucinations: number;
  avg_latency_seconds: string;
  total_processed: number;
  system_health: string;
}

export interface AgentBreakdown {
  name: string;
  success_rate: string;
  avg_node_latency: string;
  total_calls: number;
}

export interface AnalyticsResponse {
  summary: KPISummary;
  agent_breakdown: AgentBreakdown[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  event: string;
  action: string;
  resource: string;
  status: string;
  user: string;
}

export interface GovernanceResponse {
  activity_distribution: { name: string; value: number }[];
  user_activity: { user: string; count: number }[];
  compliance_health: { success: number; failure: number };
  hourly_trend: { hour: string; count: number }[];
  error_analysis: { op: string; errors: number }[];
  recent_trail: AuditTrailEntry[];
}

class AnalyticsApi {
  async getKPIs(): Promise<AnalyticsResponse> {
    const response = await fetch('/api/analytics/kpis');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async getGovernanceData(): Promise<GovernanceResponse> {
    const response = await fetch('/api/analytics/governance');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch governance data: ${response.statusText}`);
    }

    return response.json();
  }
}

export const analyticsApi = new AnalyticsApi();
