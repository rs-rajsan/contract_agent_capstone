
export interface KPISummary {
  hallucination_rate: string;
  total_hallucinations: number;
  avg_latency_seconds: string;
  total_processed: number;
  system_health: string;
  is_extrapolated?: boolean;
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
  is_extrapolated?: boolean;
}

export interface CostingResponse {
  summary: {
    total_spend: number;
    cost_per_contract: number;
    total_tokens: number;
    avg_latency_ms: number;
    min_latency_ms: number;
    max_latency_ms: number;
    projected_30d_cost: number;
    budget_limit: number;
    budget_utilization: number;
    is_extrapolated?: boolean;
  };
  trends: { date: string; cost: number }[];
  models: { name: string; cost: number; percentage: number }[];
  agents: { name: string; cost: number }[];
  efficiency: {
    input_tokens: number;
    output_tokens: number;
    ratio: number;
  };
}

class AnalyticsApi {
  private async _fetch(url: string, range: string, start?: string, end?: string) {
    let query = `range=${range}`;
    if (range === 'custom' && start && end) {
      query += `&start_date=${start}&end_date=${end}`;
    }
    const response = await fetch(`${url}?${query}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async getKPIs(range: string = '30d', start?: string, end?: string): Promise<AnalyticsResponse> {
    return this._fetch('/api/analytics/kpis', range, start, end);
  }

  async getGovernanceData(range: string = '30d', start?: string, end?: string): Promise<GovernanceResponse> {
    return this._fetch('/api/analytics/governance', range, start, end);
  }

  async getCostingData(range: string = '30d', start?: string, end?: string): Promise<CostingResponse> {
    return this._fetch('/api/analytics/costing', range, start, end);
  }
}

export const analyticsApi = new AnalyticsApi();
