import { useState, useEffect, useCallback } from 'react';

export interface AgentExecution {
  agent_name: string;
  agent_role: string;
  status: 'processing' | 'completed' | 'error';
  input_summary: string;
  output_summary: string;
  processing_time_ms: number;
  error_message?: string;
  error_code?: number;
}

export interface WorkflowStatus {
  pulse_label: string;
  total_agents: number;
  completed_agents: number;
  failed_agents: number;
  agent_executions: AgentExecution[];
}

interface UseWorkflowTracerProps {
  isPolling: boolean;
  interval?: number;
  onComplete?: (status: WorkflowStatus) => void;
  onError?: (error: string) => void;
}

export const useWorkflowTracer = ({ 
  isPolling, 
  interval = 3000, 
  onComplete, 
  onError 
}: UseWorkflowTracerProps) => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/workflow/status');
      if (!response.ok) throw new Error('Failed to fetch workflow status');
      
      const data: WorkflowStatus = await response.json();
      setStatus(data);

      // Check for terminal states
      const isFinished = data.agent_executions.length > 0 && 
                        data.agent_executions.every(e => e.status === 'completed');
      
      const hasError = data.failed_agents > 0;

      if (isFinished && !hasError) {
        onComplete?.(data);
      } else if (hasError) {
        const errorMsg = data.agent_executions.find(e => e.status === 'error')?.error_message || 'Workflow failed';
        onError?.(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown polling error';
      setError(msg);
      onError?.(msg);
    }
  }, [onComplete, onError]);

  useEffect(() => {
    if (!isPolling) {
      setStatus(null);
      setError(null);
      return;
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, interval);

    return () => clearInterval(timer);
  }, [isPolling, interval, fetchStatus]);

  return {
    status,
    pulseLabel: status?.pulse_label || (isPolling ? 'Orchestrating...' : ''),
    error,
    reset: () => {
      setStatus(null);
      setError(null);
    }
  };
};
