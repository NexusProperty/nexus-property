# CoreLogic API Monitoring Implementation Guide

This guide explains how to use the monitoring tools for the CoreLogic API integration to implement proper tracking, alerting, and performance measurement.

## Components Overview

The monitoring system consists of three main components:

1. **Circuit Breaker** (`circuit-breaker.ts`): Provides resilience against API failures by automatically preventing calls to failing endpoints.

2. **Structured Logger** (`structured-logger.ts`): Ensures consistent and structured log format for better analysis and filtering.

3. **Monitoring Integration** (`monitoring-integration.ts`): Provides metrics collection, timing, and integration with monitoring platforms.

## Getting Started

### 1. Structured Logging

Replace all console.log statements with structured logging:

```typescript
// Import the logger
import { StructuredLogger } from './monitoring/structured-logger';

// Create an instance for your module
const logger = new StructuredLogger('corelogic-service');

// Use it instead of console.log
logger.info('Processing property data', 'process_property', {
  propertyId: 'P12345',
  requestId: 'req-123'
});

// Log errors with context
try {
  // API call
} catch (error) {
  logger.error('Failed to fetch property data', 'api_error', {
    propertyId: 'P12345',
    requestId: 'req-123',
    error
  });
}
```

#### Benefits of Structured Logging

1. **Consistent Format**: All logs follow a consistent JSON structure
2. **Better Filtering**: Logs can be filtered by level, service, event type, etc.
3. **Context Preservation**: Each log includes relevant context (request ID, property ID, etc.)
4. **Sensitive Data Protection**: Automatically redacts sensitive information

### 2. Circuit Breaker Pattern

Protect API calls from cascading failures using the circuit breaker:

```typescript
// Import the circuit breaker
import { CircuitBreaker, withCircuitBreaker } from './monitoring/circuit-breaker';

// Create a circuit breaker for a specific API endpoint
const propertyDetailsBreaker = new CircuitBreaker({
  name: 'property-details-api',
  failureThreshold: 5,       // Open after 5 failures
  resetTimeoutMs: 30000,     // Try again after 30 seconds
  halfOpenMaxRequests: 3     // Allow 3 requests in half-open state
});

// Wrap your API call function with the circuit breaker
const getPropertyDetails = withCircuitBreaker(
  // Original function
  async (propertyId: string) => {
    const response = await fetch(`${API_URL}/properties/${propertyId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  },
  // Circuit breaker instance
  propertyDetailsBreaker,
  // Optional fallback function (returns cached data)
  async (propertyId: string) => {
    return getCachedPropertyDetails(propertyId);
  }
);

// Now use the protected function
try {
  const details = await getPropertyDetails('P12345');
  // Process data
} catch (error) {
  // Handle error (including circuit open errors)
}
```

#### Circuit Breaker States

1. **CLOSED**: Normal operation, all requests go through
2. **OPEN**: Circuit is broken, requests fail fast without calling the API
3. **HALF-OPEN**: Testing if the API is healthy again by allowing limited requests

### 3. Monitoring Integration

Track metrics, timings, and API calls:

```typescript
// Import the monitoring client
import { monitoring } from './monitoring/monitoring-integration';

// Record metrics
monitoring.recordMetric('properties_processed', 1, {
  type: 'residential',
  region: 'auckland'
});

// Increment counters
monitoring.incrementCounter('api_calls_total', 1, {
  endpoint: 'property-details'
});

// Measure execution time
const result = await monitoring.measureExecution(
  'get_property_details',
  async () => {
    // Function to measure
    return getPropertyDetails('P12345');
  },
  // Tags
  { propertyId: 'P12345' }
);

// Track API requests with timing and status
const response = await monitoring.trackApiRequest(
  '/property-details',
  async () => {
    return fetch(`${API_URL}/properties/P12345`);
  },
  { propertyId: 'P12345' }
);
```

## Integrating with the CoreLogic API Client

Apply these monitoring tools to the CoreLogic API client:

```typescript
import { CircuitBreaker, withCircuitBreaker } from './monitoring/circuit-breaker';
import { StructuredLogger } from './monitoring/structured-logger';
import { monitoring } from './monitoring/monitoring-integration';

export class CoreLogicApiClient {
  private logger = new StructuredLogger('corelogic-api-client');
  private circuitBreakers: Record<string, CircuitBreaker> = {};
  
  constructor() {
    // Initialize circuit breakers for each endpoint
    this.circuitBreakers.propertyDetails = new CircuitBreaker({
      name: 'property-details-api',
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      halfOpenMaxRequests: 3
    });
    
    // More circuit breakers for other endpoints...
  }
  
  async getPropertyAttributes(propertyId: string) {
    const endpoint = `/property-details/nz/properties/${propertyId}/attributes/core`;
    
    // Create a request-specific logger with context
    const requestLogger = this.logger.withContext({
      propertyId,
      requestId: generateRequestId(),
      endpoint
    });
    
    requestLogger.info('Fetching property attributes', 'api_request_start');
    
    // Wrap the API call with circuit breaker and monitoring
    const getPropertyDetailsWithBreaker = withCircuitBreaker(
      async () => {
        return monitoring.trackApiRequest(
          endpoint,
          async () => {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
              headers: await this.getAuthHeaders()
            });
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            return response;
          },
          { propertyId }
        );
      },
      this.circuitBreakers.propertyDetails,
      async () => {
        // Fallback to cache if circuit is open
        requestLogger.warn('Circuit open, using cached data', 'circuit_breaker_fallback');
        return this.getCachedPropertyDetails(propertyId);
      }
    );
    
    try {
      const response = await getPropertyDetailsWithBreaker();
      const data = await response.json();
      
      // Record success metrics
      monitoring.incrementCounter('api_calls_success', 1, {
        endpoint: 'property-details'
      });
      
      requestLogger.info('Successfully fetched property attributes', 'api_request_success', {
        dataSize: JSON.stringify(data).length
      });
      
      return data;
    } catch (error) {
      // Record error metrics
      monitoring.incrementCounter('api_calls_error', 1, {
        endpoint: 'property-details',
        errorType: error instanceof Error ? error.name : 'unknown'
      });
      
      requestLogger.error('Failed to fetch property attributes', 'api_request_error', {
        error
      });
      
      throw error;
    }
  }
  
  // Other methods with similar pattern...
}
```

## Monitoring Dashboard Configuration

Based on the metrics and logs collected, you can configure dashboards in your monitoring platform with the following panels:

1. **API Health**
   - Success rate (%)
   - Error rate (%)
   - Response time (p50, p95, p99)
   - Circuit breaker status

2. **Volume Metrics**
   - Requests per minute
   - Cache hit ratio
   - Data volume processed

3. **Error Analysis**
   - Top error types
   - Error distribution by endpoint
   - Circuit breaker events

4. **Performance**
   - Response time by endpoint
   - Slowest requests
   - Client vs. API latency

## Alert Configuration

Configure the following alerts based on the collected metrics:

1. **Error Rate Alert**
   - Trigger: >1% error rate over 5 minutes
   - Severity: Critical

2. **Latency Alert**
   - Trigger: p95 response time >2s over a 5-minute period
   - Severity: Warning

3. **Circuit Breaker Alert**
   - Trigger: Any circuit breaker entering OPEN state
   - Severity: Critical

4. **Volume Alert**
   - Trigger: Request volume deviation >30% from baseline
   - Severity: Warning

## Best Practices

1. **Log Level Usage**
   - `error`: Use for errors that need immediate attention
   - `warn`: Use for potential issues or degraded service
   - `info`: Use for tracking normal operations
   - `debug`: Use for detailed troubleshooting information

2. **Contextual Logging**
   - Always include `requestId` for request tracing
   - Include `propertyId` for property-related operations
   - Add timing information for performance-sensitive operations

3. **Circuit Breaker Configuration**
   - Set appropriate thresholds based on API reliability
   - Configure different settings for critical vs. non-critical endpoints
   - Regularly review and adjust settings based on observed behavior

4. **Metric Naming Convention**
   - Use snake_case for metric names
   - Use format: `category_action_unit` (e.g., `api_response_time_ms`)
   - Be consistent with tags and dimensions

## Next Steps

1. **Integration with Production Monitoring**
   - Connect to your organization's monitoring platform
   - Configure alerting channels and escalation policies
   - Set up on-call rotations

2. **Regular Review**
   - Schedule monthly review of monitoring effectiveness
   - Adjust thresholds and alerts based on operational experience
   - Add new metrics as needed for better visibility

3. **Documentation**
   - Keep this guide updated with new metrics and patterns
   - Document common issues and their resolution
   - Create runbooks for handling specific alerts 