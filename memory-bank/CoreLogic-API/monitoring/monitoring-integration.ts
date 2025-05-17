/**
 * CoreLogic API Monitoring Integration
 * 
 * Provides integration with monitoring services for alerts, metrics collection, and dashboards.
 * Supports abstract monitoring interface that can be implemented for different monitoring platforms.
 */

import { StructuredLogger, LogEntry, LogContext } from './structured-logger';

/**
 * Interface for monitoring service implementations
 */
export interface MonitoringService {
  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, increment?: number, tags?: Record<string, string>): void;
  
  /**
   * Record timing information
   */
  recordTiming(name: string, valueMs: number, tags?: Record<string, string>): void;
  
  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Record an API request with timing
   */
  recordApiRequest(endpoint: string, statusCode: number, durationMs: number, tags?: Record<string, string>): void;
  
  /**
   * Record a log entry
   */
  recordLog(entry: LogEntry): void;
}

/**
 * Mock monitoring service for development environments or where no external monitoring is available
 */
export class ConsoleMonitoringService implements MonitoringService {
  private logger: StructuredLogger;
  
  constructor() {
    this.logger = new StructuredLogger('monitoring-service');
  }
  
  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.logger.info(
      `Metric: ${name} = ${value}`,
      'metric_record',
      {
        metricName: name,
        metricValue: value,
        tags
      }
    );
  }
  
  public incrementCounter(name: string, increment: number = 1, tags?: Record<string, string>): void {
    this.logger.info(
      `Counter: ${name} += ${increment}`,
      'counter_increment',
      {
        counterName: name,
        increment,
        tags
      }
    );
  }
  
  public recordTiming(name: string, valueMs: number, tags?: Record<string, string>): void {
    this.logger.info(
      `Timing: ${name} = ${valueMs}ms`,
      'timing_record',
      {
        timingName: name,
        valueMs,
        tags
      }
    );
  }
  
  public setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.logger.info(
      `Gauge: ${name} = ${value}`,
      'gauge_set',
      {
        gaugeName: name,
        value,
        tags
      }
    );
  }
  
  public recordApiRequest(endpoint: string, statusCode: number, durationMs: number, tags?: Record<string, string>): void {
    const category = this.getStatusCategory(statusCode);
    
    this.logger.info(
      `API Request: ${endpoint} - ${statusCode} (${category}) - ${durationMs}ms`,
      'api_request_record',
      {
        endpoint,
        statusCode,
        durationMs,
        category,
        tags
      }
    );
    
    // Increment counter for status category
    this.incrementCounter('api_requests_total', 1, {
      ...tags,
      endpoint,
      status_category: category
    });
    
    // Record timing
    this.recordTiming('api_request_duration', durationMs, {
      ...tags,
      endpoint
    });
  }
  
  public recordLog(entry: LogEntry): void {
    // Simply pass through to console in this implementation
    switch (entry.level) {
      case 'error':
        console.error(JSON.stringify(entry));
        break;
      case 'warn':
        console.warn(JSON.stringify(entry));
        break;
      case 'info':
        console.log(JSON.stringify(entry));
        break;
      case 'debug':
        console.debug(JSON.stringify(entry));
        break;
    }
  }
  
  private getStatusCategory(statusCode: number): string {
    if (statusCode < 100) return 'unknown';
    if (statusCode < 200) return 'informational';
    if (statusCode < 300) return 'success';
    if (statusCode < 400) return 'redirect';
    if (statusCode < 500) return 'client_error';
    if (statusCode < 600) return 'server_error';
    return 'unknown';
  }
}

/**
 * Main monitoring client that provides a unified interface for all monitoring activities
 */
export class MonitoringClient {
  private static instance: MonitoringClient;
  private service: MonitoringService;
  private logger: StructuredLogger;
  private additionalTags: Record<string, string>;
  
  private constructor(
    service: MonitoringService,
    globalTags: Record<string, string> = {}
  ) {
    this.service = service;
    this.logger = new StructuredLogger('monitoring-client');
    this.additionalTags = globalTags;
  }
  
  /**
   * Get or initialize the singleton instance of the monitoring client
   */
  public static getInstance(
    service?: MonitoringService,
    globalTags?: Record<string, string>
  ): MonitoringClient {
    if (!MonitoringClient.instance) {
      // If no service is provided, use the console implementation
      const actualService = service || new ConsoleMonitoringService();
      MonitoringClient.instance = new MonitoringClient(actualService, globalTags || {});
    }
    
    return MonitoringClient.instance;
  }
  
  /**
   * Record time taken to execute a function
   */
  public async measureExecution<T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;
      
      this.service.recordTiming(name, durationMs, this.mergeTags(tags));
      
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      this.service.recordTiming(name, durationMs, this.mergeTags({
        ...tags,
        status: 'error'
      }));
      
      throw error;
    }
  }
  
  /**
   * Track API request
   */
  public trackApiRequest(
    endpoint: string,
    fn: () => Promise<Response>,
    tags?: Record<string, string>
  ): Promise<Response> {
    return this.measureExecution(
      'api_request',
      async () => {
        const response = await fn();
        
        this.service.recordApiRequest(
          endpoint,
          response.status,
          0, // Timing is handled by measureExecution
          this.mergeTags(tags)
        );
        
        return response;
      },
      { endpoint, ...tags }
    );
  }
  
  /**
   * Record a metric
   */
  public recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    this.service.recordMetric(name, value, this.mergeTags(tags));
  }
  
  /**
   * Increment a counter
   */
  public incrementCounter(
    name: string,
    increment: number = 1,
    tags?: Record<string, string>
  ): void {
    this.service.incrementCounter(name, increment, this.mergeTags(tags));
  }
  
  /**
   * Record a log with monitoring context
   */
  public logWithMonitoring(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    event: string,
    context: LogContext = {}
  ): void {
    const entry: LogEntry = {
      level,
      service: (context.service as string) || 'corelogic-api',
      event,
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    this.service.recordLog(entry);
  }
  
  /**
   * Helper to merge global tags with specific tags
   */
  private mergeTags(tags?: Record<string, string>): Record<string, string> {
    return {
      ...this.additionalTags,
      ...tags
    };
  }
}

// Convenience export for the default console-based implementation
export const monitoring = MonitoringClient.getInstance(); 