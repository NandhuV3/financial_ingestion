type LogLevel = "INFO" | "WARN" | "ERROR";

type LogContext = {
  component: string;
  ticker?: string;
  filing_date?: string;
  duration_ms?: number;
  [key: string]: string | number | boolean | undefined;
};

export function createLogger(component: string) {
  return {
    info(message: string, context: Omit<LogContext, "component"> = {}) {
      log("INFO", message, { component, ...context });
    },
    warn(message: string, context: Omit<LogContext, "component"> = {}) {
      log("WARN", message, { component, ...context });
    },
    error(message: string, context: Omit<LogContext, "component"> = {}) {
      log("ERROR", message, { component, ...context });
    },
  };
}

function log(level: LogLevel, message: string, context: LogContext): void {
  console.log(JSON.stringify({
    level,
    message,
    ...context,
  }));
}
