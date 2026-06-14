type LogContext = Record<string, string | number | boolean | undefined>;

function emit(_level: "info" | "warn" | "error", _message: string, _context?: LogContext): void {
  // Placeholder for future browser observability integration.
}

export const logger = {
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
};
