import { useState, useEffect, useCallback, useRef } from 'react';

export interface WorkflowStatus {
  agent_executions: Array<{
    agent_name: string;
    status: string;
    step_description?: string;
    result?: string;
    timestamp?: string;
  }>;
}

export const useWorkflowStatus = (isEnabled: boolean = false, correlationId: string | null = null, intervalMs: number = 1000) => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!correlationId) return;
    
    try {
      const response = await fetch(`/api/supervisor/workflow/${correlationId}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status) {
          setStatus(data.status);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch workflow status'));
    }
  }, [correlationId]);

  useEffect(() => {
    if (isEnabled) {
      // Fetch immediately
      fetchStatus();
      
      // Setup interval
      intervalRef.current = setInterval(fetchStatus, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, intervalMs, fetchStatus]);

  return { status, error, refetch: fetchStatus };
};
