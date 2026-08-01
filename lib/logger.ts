type LogLevel = 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

function redact(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
      if (SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s))) {
        return [k, '***REDACTED***'];
      }
      return [k, redact(v)];
    })
  );
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  };

  if (process.env.NODE_ENV === 'production') {
    console[level](JSON.stringify(entry));
  } else {
    console[level](`[${level.toUpperCase()}] ${message}`, meta || '');
  }
}
