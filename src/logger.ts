import winston from 'winston';

// Force no colors for MCP server mode - multiple approaches
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    // Remove all colors and use simple JSON format
    winston.format.uncolorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // Always output plain JSON for MCP compatibility
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  defaultMeta: { service: 'youtrack-mcp' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      // Send ALL log levels to stderr (not stdout) for MCP compatibility
      // MCP servers must only write JSON-RPC messages to stdout
      stderrLevels: ['error', 'warn', 'info', 'debug', 'verbose', 'silly'],
      // Explicitly disable colors
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
          });
        })
      )
    })
  ],
});

// Helper function for logging API calls
export function logApiCall(method: string, endpoint: string, params?: any): void {
  logger.info('API Call', {
    method,
    endpoint,
    params: params ? JSON.stringify(params) : undefined,
    timestamp: new Date().toISOString(),
  });
}

// Helper function for logging errors
export function logError(error: Error, context?: any): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
