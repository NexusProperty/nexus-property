/**
 * CoreLogic API Monitoring Dashboard Configuration
 * 
 * This file provides configuration for monitoring dashboards that visualize
 * the performance, health, and usage metrics for the CoreLogic API integration.
 * 
 * The configurations can be exported to various monitoring platforms like 
 * Datadog, New Relic, or custom dashboard implementations.
 */

import { MonitoringClient } from './monitoring-integration';

/**
 * Dashboard configuration interfaces
 */
export interface DashboardPanel {
  id: string;
  title: string;
  description: string;
  type: 'time-series' | 'counter' | 'gauge' | 'table' | 'heatmap' | 'status' | 'pie';
  metrics: string[];
  filters?: Record<string, string | string[]>;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  visualization?: 'line' | 'bar' | 'area' | 'pie';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface Dashboard {
  id: string;
  title: string;
  description: string;
  panels: DashboardPanel[];
  tags?: string[];
  refreshInterval?: number; // in seconds
}

/**
 * API Health Dashboard Configuration
 */
export const apiHealthDashboard: Dashboard = {
  id: 'corelogic-api-health',
  title: 'CoreLogic API Health',
  description: 'Monitors the health, performance, and reliability of the CoreLogic API integration',
  refreshInterval: 60, // 1 minute
  tags: ['corelogic', 'api', 'health'],
  panels: [
    // API Request Volume
    {
      id: 'api-request-volume',
      title: 'API Request Volume',
      description: 'Number of requests made to CoreLogic API endpoints over time',
      type: 'time-series',
      metrics: ['api_requests_total'],
      groupBy: ['endpoint'],
      aggregation: 'sum',
      visualization: 'line'
    },
    
    // API Success Rate
    {
      id: 'api-success-rate',
      title: 'API Success Rate (%)',
      description: 'Percentage of successful API requests',
      type: 'gauge',
      metrics: ['api_success_rate'],
      thresholds: {
        warning: 95,
        critical: 90
      }
    },
    
    // API Error Rate
    {
      id: 'api-error-rate',
      title: 'API Error Rate (%)',
      description: 'Percentage of failed API requests',
      type: 'time-series',
      metrics: ['api_error_rate'],
      thresholds: {
        warning: 1,
        critical: 5
      },
      visualization: 'area'
    },
    
    // API Response Time
    {
      id: 'api-response-time',
      title: 'API Response Time (ms)',
      description: 'Response time for CoreLogic API endpoints (p50, p95, p99)',
      type: 'time-series',
      metrics: ['api_request_duration_p50', 'api_request_duration_p95', 'api_request_duration_p99'],
      groupBy: ['endpoint'],
      visualization: 'line'
    },
    
    // Circuit Breaker Status
    {
      id: 'circuit-breaker-status',
      title: 'Circuit Breaker Status',
      description: 'Current state of circuit breakers for each endpoint',
      type: 'status',
      metrics: ['circuit_breaker_state'],
      groupBy: ['endpoint', 'state']
    },
    
    // Failure Count by Endpoint
    {
      id: 'failure-count-by-endpoint',
      title: 'Failure Count by Endpoint',
      description: 'Number of failures for each API endpoint',
      type: 'counter',
      metrics: ['api_requests_total'],
      filters: {
        'status_category': ['client_error', 'server_error']
      },
      groupBy: ['endpoint', 'status_category'],
      aggregation: 'sum'
    }
  ]
};

/**
 * API Performance Dashboard Configuration
 */
export const apiPerformanceDashboard: Dashboard = {
  id: 'corelogic-api-performance',
  title: 'CoreLogic API Performance',
  description: 'Detailed performance metrics for the CoreLogic API integration',
  refreshInterval: 120, // 2 minutes
  tags: ['corelogic', 'api', 'performance'],
  panels: [
    // Request Latency by Endpoint
    {
      id: 'request-latency-by-endpoint',
      title: 'Request Latency by Endpoint (ms)',
      description: 'Average response time for each CoreLogic API endpoint',
      type: 'time-series',
      metrics: ['api_request_duration'],
      groupBy: ['endpoint'],
      aggregation: 'avg',
      visualization: 'line'
    },
    
    // Slowest Requests
    {
      id: 'slowest-requests',
      title: 'Slowest Requests',
      description: 'Top 10 slowest API requests',
      type: 'table',
      metrics: ['api_request_duration'],
      aggregation: 'max',
      groupBy: ['endpoint', 'propertyId']
    },
    
    // Cache Hit Ratio
    {
      id: 'cache-hit-ratio',
      title: 'Cache Hit Ratio (%)',
      description: 'Percentage of requests served from cache',
      type: 'gauge',
      metrics: ['cache_hit_ratio'],
      thresholds: {
        warning: 30,  // Warning if cache hit ratio is below 30%
        critical: 10  // Critical if cache hit ratio is below 10%
      }
    },
    
    // Cache Hit/Miss Over Time
    {
      id: 'cache-hit-miss-over-time',
      title: 'Cache Hit/Miss Over Time',
      description: 'Number of cache hits and misses over time',
      type: 'time-series',
      metrics: ['cache_hits', 'cache_misses'],
      visualization: 'area'
    },
    
    // Client vs API Latency
    {
      id: 'client-vs-api-latency',
      title: 'Client vs API Latency (ms)',
      description: 'Comparison of client-side processing time vs API call time',
      type: 'time-series',
      metrics: ['client_processing_time', 'api_request_duration'],
      visualization: 'line'
    },
    
    // API Quota Usage
    {
      id: 'api-quota-usage',
      title: 'API Quota Usage (%)',
      description: 'Percentage of daily API quota used',
      type: 'gauge',
      metrics: ['api_quota_usage_percent'],
      thresholds: {
        warning: 80,  // Warning at 80% of quota
        critical: 95  // Critical at 95% of quota
      }
    }
  ]
};

/**
 * Error Analysis Dashboard Configuration
 */
export const errorAnalysisDashboard: Dashboard = {
  id: 'corelogic-error-analysis',
  title: 'CoreLogic API Error Analysis',
  description: 'Detailed analysis of errors occurring in the CoreLogic API integration',
  refreshInterval: 300, // 5 minutes
  tags: ['corelogic', 'api', 'errors'],
  panels: [
    // Error Distribution by Type
    {
      id: 'error-distribution-by-type',
      title: 'Error Distribution by Type',
      description: 'Distribution of errors by error type',
      type: 'pie',
      metrics: ['api_errors_total'],
      groupBy: ['errorType'],
      aggregation: 'sum',
      visualization: 'pie'
    },
    
    // Error Distribution by Endpoint
    {
      id: 'error-distribution-by-endpoint',
      title: 'Error Distribution by Endpoint',
      description: 'Distribution of errors by API endpoint',
      type: 'pie',
      metrics: ['api_errors_total'],
      groupBy: ['endpoint'],
      aggregation: 'sum',
      visualization: 'pie'
    },
    
    // Error Rate Over Time
    {
      id: 'error-rate-over-time',
      title: 'Error Rate Over Time (%)',
      description: 'Error rate percentage over time',
      type: 'time-series',
      metrics: ['api_error_rate'],
      visualization: 'line'
    },
    
    // Top Error Messages
    {
      id: 'top-error-messages',
      title: 'Top Error Messages',
      description: 'Most common error messages',
      type: 'table',
      metrics: ['api_errors_total'],
      groupBy: ['errorMessage'],
      aggregation: 'count'
    },
    
    // Circuit Breaker Events
    {
      id: 'circuit-breaker-events',
      title: 'Circuit Breaker Events',
      description: 'Circuit breaker state change events',
      type: 'time-series',
      metrics: ['circuit_breaker_state_changes'],
      groupBy: ['endpoint', 'fromState', 'toState'],
      visualization: 'bar'
    },
    
    // Error Heatmap by Time
    {
      id: 'error-heatmap-by-time',
      title: 'Error Heatmap by Time',
      description: 'Heatmap showing error concentration by time of day',
      type: 'heatmap',
      metrics: ['api_errors_total'],
      groupBy: ['hour_of_day', 'endpoint']
    }
  ]
};

/**
 * Feature Flag Dashboard Configuration
 */
export const featureFlagDashboard: Dashboard = {
  id: 'corelogic-feature-flags',
  title: 'CoreLogic Feature Flags',
  description: 'Monitoring for CoreLogic feature flag usage and impact',
  refreshInterval: 300, // 5 minutes
  tags: ['corelogic', 'feature-flags'],
  panels: [
    // Feature Flag Status
    {
      id: 'feature-flag-status',
      title: 'Feature Flag Status',
      description: 'Current status of CoreLogic feature flags',
      type: 'table',
      metrics: ['feature_flag_state'],
      groupBy: ['flagName', 'enabled', 'percentage']
    },
    
    // Feature Flag Usage
    {
      id: 'feature-flag-usage',
      title: 'Feature Flag Usage',
      description: 'Number of times each feature flag is evaluated',
      type: 'counter',
      metrics: ['feature_flag_evaluations'],
      groupBy: ['flagName', 'result'],
      aggregation: 'sum'
    },
    
    // Feature Flag Impact on Performance
    {
      id: 'feature-flag-performance-impact',
      title: 'Feature Flag Impact on Performance',
      description: 'Comparison of API response time with feature flags enabled vs disabled',
      type: 'time-series',
      metrics: ['api_request_duration'],
      groupBy: ['endpoint', 'feature_enabled'],
      aggregation: 'avg',
      visualization: 'line'
    },
    
    // Feature Flag Rollout Progress
    {
      id: 'feature-flag-rollout',
      title: 'Feature Flag Rollout Progress',
      description: 'Percentage rollout progress for feature flags',
      type: 'gauge',
      metrics: ['feature_flag_percentage'],
      groupBy: ['flagName']
    }
  ]
};

/**
 * Create all monitoring dashboards
 */
export function createMonitoringDashboards(client: MonitoringClient): void {
  // Implementation would depend on the actual monitoring platform integration
  console.log(JSON.stringify({
    level: 'info',
    service: 'monitoring-setup',
    event: 'dashboards_configured',
    message: 'Monitoring dashboards configured',
    dashboards: [
      apiHealthDashboard.id,
      apiPerformanceDashboard.id,
      errorAnalysisDashboard.id,
      featureFlagDashboard.id
    ]
  }));
}

/**
 * Dashboard export utilities
 * These functions would be implemented based on the specific monitoring platform
 */
export const dashboardExporters = {
  toDatadog: (dashboard: Dashboard): string => {
    // Convert dashboard config to Datadog dashboard JSON
    return JSON.stringify(dashboard);
  },
  
  toNewRelic: (dashboard: Dashboard): string => {
    // Convert dashboard config to New Relic dashboard JSON
    return JSON.stringify(dashboard);
  },
  
  toGrafana: (dashboard: Dashboard): string => {
    // Convert dashboard config to Grafana dashboard JSON
    return JSON.stringify(dashboard);
  }
}; 