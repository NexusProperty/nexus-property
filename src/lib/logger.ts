/**
 * Logging Service
 * 
 * This utility provides centralized logging functionality for the application.
 * It supports different log levels, structured logging, and can be configured
 * for different environments.
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  applicationName: string;
  environment: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  applicationName: 'nexus-property',
  environment: process.env.NODE_ENV || 'development',
};

/**
 * Logger class for centralized logging
 */
export class Logger {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Log a message with DEBUG level
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Log a message with INFO level
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Log a message with WARN level
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Log a message with ERROR level
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
  
  /**
   * Log a message with CRITICAL level
   */
  critical(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }
  
  /**
   * Log a message with specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | unknown
  ): void {
    // Skip if log level is below minimum
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
    
    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
    
    // Log to remote service if enabled
    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }
  
  /**
   * Determine if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Log to the console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry;
    
    // Format the log message
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      formattedMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Log with appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        if (error) {
          if (error instanceof Error) {
            console.error(`Error: ${error.message}\nStack: ${error.stack}`);
          } else {
            console.error('Error:', error);
          }
        }
        break;
    }
  }
  
  /**
   * Log to a remote service
   */
  private logToRemote(entry: LogEntry): void {
    // Enrich log entry with application metadata
    const enrichedEntry = {
      ...entry,
      application: this.config.applicationName,
      environment: this.config.environment,
    };
    
    // In a real implementation, this would send to a remote logging service
    // For example, using Sentry, LogRocket, or a custom endpoint
    try {
      // Simulated remote logging
      if (process.env.NODE_ENV !== 'test') {
        // Mock implementation for now
        console.debug(`[REMOTE LOG] ${JSON.stringify(enrichedEntry)}`);
        
        // Example of how to send to a real service:
        // fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(enrichedEntry),
        // });
      }
    } catch (err) {
      // Fallback to console if remote logging fails
      console.error('[Logger] Failed to send log to remote service:', err);
      this.logToConsole(entry);
    }
  }
}

// Create and export a default logger instance
export const logger = new Logger();

// Export utility functions for direct use
export const debug = (message: string, context?: Record<string, unknown>): void => 
  logger.debug(message, context);

export const info = (message: string, context?: Record<string, unknown>): void => 
  logger.info(message, context);

export const warn = (message: string, context?: Record<string, unknown>): void => 
  logger.warn(message, context);

export const error = (message: string, error?: Error | unknown, context?: Record<string, unknown>): void => 
  logger.error(message, error, context);

export const critical = (message: string, error?: Error | unknown, context?: Record<string, unknown>): void => 
  logger.critical(message, error, context); 