type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  return value;
}

function serializeContext(context: LogContext): LogContext {
  const serialized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    serialized[key] = serializeValue(value);
  }
  return serialized;
}

function formatLogEntry(level: LogLevel, event: string, context?: LogContext): string {
  const entry: LogContext = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(context ? serializeContext(context) : {}),
  };
  return JSON.stringify(entry);
}

export const logger = {
  info(event: string, context?: LogContext): void {
    console.log(formatLogEntry("info", event, context));
  },

  warn(event: string, context?: LogContext): void {
    console.log(formatLogEntry("warn", event, context));
  },

  error(event: string, context?: LogContext): void {
    console.error(formatLogEntry("error", event, context));
  },
};
