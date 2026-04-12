type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const isDev = import.meta.env.DEV;

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!isDev && level === 'debug') return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context || {}),
  };

  if (isDev) {
    // In dev, we use console without breaking the lint rule (by bypassing it using an indirect ref or just ignoring it here)
    // We disable the lint rule for this specific file
    // eslint-disable-next-line no-console
    const consoleMethod = level === 'info' ? console.log : console[level];
    
    // eslint-disable-next-line no-console
    consoleMethod(`[${level.toUpperCase()}] ${message}`, context ? context : '');
  } else {
    // In prod, this would be sent to a telemetry endpoint.
    // E.g., fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) })
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};
