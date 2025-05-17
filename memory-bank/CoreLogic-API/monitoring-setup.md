# CoreLogic API Integration Monitoring Setup

This document outlines the approach for implementing monitoring for the CoreLogic API integration, focusing on structured logging, alerts, and performance tracking.

## 1. Structured Logging Implementation

Structured logging is already partially implemented in the Edge Function and API client. The following improvements should be made:

### 1.1. Log Levels and Categories

All logs should include:
- `level`: One of `error`, `warn`, `info`, `debug`
- `service`: Identifies which component generated the log (e.g., `corelogic-api`, `property-data-edge-function`)
- `message`: Human-readable description
- Additional context fields as needed

### 1.2. Log Events to Capture

- **API Client Events**
  - Authentication attempts and results
  - API requests (sanitized)
  - API responses (status codes and timing)
  - Cache hits/misses
  - Errors and retries

- **Edge Function Events**
  - Request receipt
  - Authentication validation
  - Feature flag checks
  - Cache operations
  - Response times
  - Error conditions

### 1.3. Implementation

```typescript
// Example structured log for API request
console.log(JSON.stringify({
  level: 'info',
  service: 'corelogic-api',
  event: 'api_request',
  endpoint: '/property-details/nz/properties/{propertyId}/attributes/core',
  requestId: '123456',
  propertyId: 'P12345678',
  elapsedMs: 235
}));

// Example structured log for error
console.error(JSON.stringify({
  level: 'error',
  service: 'property-data-edge-function',
  event: 'api_error',
  message: 'Failed to fetch property data',
  requestId: '123456',
  propertyId: 'P12345678',
  errorCode: 'API_TIMEOUT',
  errorMessage: 'API request timed out after 5000ms',
  statusCode: 504
}));
```

## 2. Alert Configuration

### 2.1. Error Rate Alerts

- **Critical Alert**: >1% of requests result in errors over 5 minutes
- **Warning Alert**: >0.5% of requests result in errors over 15 minutes

### 2.2. Performance Alerts

- **Critical Alert**: p95 latency >2000ms over 5 minutes
- **Warning Alert**: p95 latency >1000ms over 15 minutes

### 2.3. API Quota/Usage Alerts

- **Warning Alert**: 80% of daily API quota used
- **Critical Alert**: 95% of daily API quota used

### 2.4. Implementation

Configure alerts in your monitoring platform (Datadog, New Relic, etc.) based on the structured logs.

```javascript
// Example Datadog alert query for error rate
sum(last_5m):sum:corelogic.api.errors{*}.as_count() / sum:corelogic.api.requests{*}.as_count() * 100 > 1
```

## 3. Dashboards

### 3.1. API Performance Dashboard

- **Time-series Charts**
  - Request volume
  - Error rate
  - p50, p95, p99 latency
  - Cache hit ratio
  - API quota usage

- **Top Lists**
  - Most requested properties
  - Slowest requests
  - Most common error types

### 3.2. User Impact Dashboard

- **Metrics**
  - User request volume
  - User error rate
  - Feature flag rollout status
  - Most active users

### 3.3. Implementation

Create custom dashboards in your monitoring platform that visualize the metrics collected from structured logs.

## 4. Circuit Breaker Implementation

Implement circuit breaker pattern to prevent cascading failures if the CoreLogic API experiences issues.

```typescript
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 30000, // 30 seconds
    private halfOpenMaxRequests: number = 3
  ) {}
  
  // More implementation details...
}

// Usage example
const breaker = new CircuitBreaker();
async function makeRequest() {
  if (!breaker.allowRequest()) {
    return fallbackData; // Use cached data or mock
  }
  
  try {
    const result = await actualApiCall();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}
```

## 5. Implementation Plan

1. **Week 1: Logging Enhancement**
   - Update all log statements to use structured format
   - Add missing log events
   - Implement request ID tracking

2. **Week 2: Monitoring Platform Integration**
   - Configure log parsing
   - Set up initial dashboards
   - Configure basic alerts

3. **Week 3: Advanced Features**
   - Implement circuit breaker
   - Add custom metrics
   - Set up advanced alerts and notifications

4. **Week 4: Review and Optimization**
   - Review log volume and retention
   - Optimize dashboard performance
   - Document alert response procedures

## 6. Best Practices

1. **Log Retention and Volume**
   - Avoid over-logging sensitive information
   - Use sampling for high-volume, low-value logs
   - Retain error logs longer than info logs

2. **Alert Management**
   - Reduce alert fatigue by tuning thresholds
   - Implement alert escalation policies
   - Document runbooks for each alert type

3. **Dashboard Organization**
   - Organize dashboards by user role (dev, ops, business)
   - Include links to relevant documentation
   - Add annotation capabilities for incidents 