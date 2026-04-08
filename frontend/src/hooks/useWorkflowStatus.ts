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

export const useWorkflowStatus = (isEnabled: boolean = false, intervalMs: number = 500) => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/workflow/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch workflow status'));
    }
  }, []);

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
