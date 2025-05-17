/**
 * Structured Logging Utility for CoreLogic API Integration
 * 
 * Provides consistent logging format for improved monitoring and analysis
 * of API interactions, errors, and performance metrics.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  /** Request ID for tracing */
  requestId?: string;
  /** User ID if available */
  userId?: string;
  /** Property ID if relevant */
  propertyId?: string;
  /** URI or endpoint being accessed */
  endpoint?: string;
  /** HTTP status code if relevant */
  statusCode?: number;
  /** Error details if relevant */
  error?: Error | unknown;
  /** Timing information in milliseconds */
  elapsedMs?: number;
  /** Any additional context for the log entry */
  [key: string]: unknown;
}

export interface LogEntry extends LogContext {
  /** Log severity level */
  level: LogLevel;
  /** Service or component that generated the log */
  service: string;
  /** Event type for categorization */
  event: string;
  /** Human-readable message */
  message: string;
  /** ISO timestamp */
  timestamp: string;
}

export class StructuredLogger {
  constructor(
    private defaultService: string = 'corelogic-api'
  ) {}

  /**
   * Log an error event
   */
  public error(message: string, event: string, context: LogContext = {}): void {
    this.log('error', message, event, context);
  }

  /**
   * Log a warning event
   */
  public warn(message: string, event: string, context: LogContext = {}): void {
    this.log('warn', message, event, context);
  }

  /**
   * Log an informational event
   */
  public info(message: string, event: string, context: LogContext = {}): void {
    this.log('info', message, event, context);
  }

  /**
   * Log a debug event
   */
  public debug(message: string, event: string, context: LogContext = {}): void {
    this.log('debug', message, event, context);
  }

  /**
   * Log API request details
   */
  public apiRequest(endpoint: string, context: LogContext = {}): void {
    this.info(
      `API request to ${endpoint}`,
      'api_request',
      {
        ...context,
        endpoint
      }
    );
  }

  /**
   * Log API response details
   */
  public apiResponse(endpoint: string, statusCode: number, elapsedMs: number, context: LogContext = {}): void {
    this.info(
      `API response from ${endpoint}: ${statusCode}`,
      'api_response',
      {
        ...context,
        endpoint,
        statusCode,
        elapsedMs
      }
    );
  }

  /**
   * Log API error details
   */
  public apiError(endpoint: string, error: Error | unknown, context: LogContext = {}): void {
    let errorMessage = 'Unknown error';
    let errorDetails: Record<string, unknown> = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    this.error(
      `API error from ${endpoint}: ${errorMessage}`,
      'api_error',
      {
        ...context,
        endpoint,
        error: errorDetails
      }
    );
  }

  /**
   * Log cache operation details
   */
  public cacheOperation(operation: 'hit' | 'miss' | 'set' | 'expired', propertyId: string, context: LogContext = {}): void {
    this.info(
      `Cache ${operation} for property ${propertyId}`,
      `cache_${operation}`,
      {
        ...context,
        propertyId
      }
    );
  }

  /**
   * Log feature flag check
   */
  public featureFlagCheck(flagId: string, enabled: boolean, context: LogContext = {}): void {
    this.info(
      `Feature flag ${flagId} is ${enabled ? 'enabled' : 'disabled'}`,
      'feature_flag_check',
      {
        ...context,
        flagId,
        enabled
      }
    );
  }

  /**
   * Log performance metric
   */
  public performance(operation: string, elapsedMs: number, context: LogContext = {}): void {
    this.info(
      `Performance: ${operation} took ${elapsedMs}ms`,
      'performance_metric',
      {
        ...context,
        operation,
        elapsedMs
      }
    );
  }

  /**
   * Create a child logger with additional context
   */
  public withContext(additionalContext: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(this.defaultService);
    
    // Override log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, event: string, context: LogContext = {}) => {
      originalLog(level, message, event, {
        ...additionalContext,
        ...context
      });
    };
    
    return childLogger;
  }

  /**
   * Base log method
   */
  public log(level: LogLevel, message: string, event: string, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      level,
      service: this.defaultService,
      event,
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    // Sanitize log entry to avoid exposing sensitive data
    this.sanitizeLogEntry(logEntry);
    
    // Log using appropriate console method
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'info':
        console.log(JSON.stringify(logEntry));
        break;
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
    }
  }

  /**
   * Remove sensitive information from log entries
   */
  private sanitizeLogEntry(logEntry: LogEntry): void {
    // Sanitize any sensitive fields that might be in the context
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    for (const field of sensitiveFields) {
      if (field in logEntry) {
        logEntry[field] = '[REDACTED]';
      }
    }
    
    // Sanitize error stack traces to remove sensitive information
    if (logEntry.error && typeof logEntry.error === 'object' && 'stack' in logEntry.error) {
      // Remove file paths that might contain sensitive information
      if (typeof logEntry.error.stack === 'string') {
        logEntry.error.stack = logEntry.error.stack
          .split('\n')
          .map(line => {
            // Replace absolute file paths with relative paths
            return line.replace(/\(([^)]+)\)/g, (match, path) => {
              const parts = path.split('/');
              const filename = parts[parts.length - 1];
              return `(${filename})`;
            });
          })
          .join('\n');
      }
    }
  }
} 