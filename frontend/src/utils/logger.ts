type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const isDev = import.meta.env.DEV;

let isSendingLog = false;

function log(level: LogLevel, message: string, context?: Record<string, unknown>, statusCode?: number) {
  // SECURITY REQUIREMENT: Never write logs to the browser console.
  if (!isDev && level === 'debug') return;

  // Prevent infinite loops if the logging request itself fails and tries to log an error
  if (isSendingLog) return;
  
  // Resolve Backend URL (local development default)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.includes('backend:8000') 
    ? 'http://localhost:8000' 
    : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');

  isSendingLog = true;
  fetch(`${BACKEND_URL}/api/monitoring/logs/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, context, status_code: statusCode }),
  }).catch(() => {
    // Silently fail if ingestion is down to avoid UI disruption or console spam
  }).finally(() => {
    isSendingLog = false;
  });
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>, statusCode?: number) => log('info', message, context, statusCode),
  warn: (message: string, context?: Record<string, unknown>, statusCode?: number) => log('warn', message, context, statusCode),
  error: (message: string, context?: Record<string, unknown>, statusCode?: number) => log('error', message, context, statusCode),
};
