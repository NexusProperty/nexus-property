# CoreLogic API Monitoring Dashboard Setup Guide

This guide provides step-by-step instructions for setting up monitoring dashboards for the CoreLogic API integration.

## Prerequisites

Before setting up the monitoring dashboards, ensure you have:

1. Access credentials for your monitoring platform (e.g., Datadog, New Relic, Grafana)
2. Properly implemented structured logging in the CoreLogic API integration
3. Required permissions to create dashboards and alerts

## Dashboard Types

We've created four types of monitoring dashboards for comprehensive monitoring of the CoreLogic API integration:

1. **API Health Dashboard** - For overall health monitoring and immediate issues
2. **API Performance Dashboard** - For detailed performance metrics and optimization
3. **Error Analysis Dashboard** - For investigating specific error patterns
4. **Feature Flag Dashboard** - For monitoring feature flag usage and impact

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install --save-dev @datadog/browser-logs @datadog/browser-rum
# Or for New Relic
# npm install --save-dev newrelic
```

### 2. Configure Environment Variables

Add the following environment variables to your Supabase Edge Function configuration:

```
MONITORING_PLATFORM=datadog
DATADOG_API_KEY=your_api_key
DATADOG_APP_KEY=your_app_key
DATADOG_SITE=us or eu
```

### 3. Initialize the Monitoring Platform

Call the initialization function from your application's startup code:

```typescript
import { initializeMonitoringDashboards } from './monitoring/monitoring-platform-integration';

// Initialize monitoring dashboards
await initializeMonitoringDashboards(
  process.env.DATADOG_API_KEY,
  process.env.DATADOG_APP_KEY,
  process.env.NODE_ENV // 'production', 'staging', etc.
);
```

### 4. Dashboard Import (Alternative Manual Setup)

If you prefer to set up the dashboards manually, you can import the JSON configurations:

1. Go to your monitoring platform's dashboard creation interface
2. Select "Import Dashboard" or similar option
3. Paste the JSON configuration for each dashboard

You can generate the JSON configurations by calling the appropriate export function:

```typescript
import { dashboardExporters, apiHealthDashboard } from './monitoring/monitoring-dashboard';

// For Datadog
const datadogJson = dashboardExporters.toDatadog(apiHealthDashboard);
console.log(datadogJson);

// For New Relic
const newRelicJson = dashboardExporters.toNewRelic(apiHealthDashboard);
console.log(newRelicJson);

// For Grafana
const grafanaJson = dashboardExporters.toGrafana(apiHealthDashboard);
console.log(grafanaJson);
```

## Dashboard Descriptions

### 1. API Health Dashboard

The API Health Dashboard provides at-a-glance information about the overall health of the CoreLogic API integration. It includes:

- Request volume metrics
- Success/error rates
- Response time trends
- Circuit breaker status
- Failure distribution by endpoint

**Primary audience:** Operations and on-call engineers who need to quickly identify issues.

### 2. API Performance Dashboard

The API Performance Dashboard provides detailed metrics about API performance, useful for optimization and capacity planning:

- Request latency by endpoint
- Slowest requests
- Cache hit ratio
- API quota usage
- Client vs. API latency comparison

**Primary audience:** Developers and performance engineers working on optimization.

### 3. Error Analysis Dashboard

The Error Analysis Dashboard helps in deep-diving into error patterns and troubleshooting:

- Error distribution by type
- Error distribution by endpoint
- Error trends over time
- Most common error messages
- Circuit breaker events
- Error patterns by time of day

**Primary audience:** Developers and support engineers troubleshooting specific issues.

### 4. Feature Flag Dashboard

The Feature Flag Dashboard monitors the usage and impact of feature flags:

- Feature flag status
- Feature flag usage metrics
- Performance impact of feature flags
- Rollout progress tracking

**Primary audience:** Product managers and developers managing feature releases.

## Alert Configuration

The monitoring setup includes preconfigured alerts for critical conditions:

1. **Error Rate Alert**
   - Triggers when error rate exceeds 1% over 5 minutes
   - Priority: Critical

2. **Latency Alert**
   - Triggers when p95 response time exceeds 2000ms over 5 minutes
   - Priority: Warning

3. **Circuit Breaker Alert**
   - Triggers when any circuit breaker enters OPEN state
   - Priority: Critical

4. **API Quota Alert**
   - Triggers when API quota usage exceeds 80%
   - Priority: Warning

## Customization

You can customize the dashboards and alerts by modifying the configuration files:

- `monitoring-dashboard.ts` - Dashboard and panel configurations
- `monitoring-platform-integration.ts` - Platform-specific implementation

## Troubleshooting

If you encounter issues with the monitoring setup:

1. **Missing metrics:** Ensure that the structured logging is properly implemented and emitting the expected metrics. Check the metric names in the dashboard configuration.

2. **Dashboard creation fails:** Verify that the API keys have the necessary permissions to create dashboards and monitors.

3. **Alerts not triggering:** Check that the query syntax is correct for your monitoring platform and that alert notifications are properly configured.

## Support and Maintenance

The monitoring dashboards should be reviewed and updated regularly:

- Monthly review of alert thresholds and monitoring effectiveness
- Updates when new CoreLogic API endpoints are added
- Adjustments based on observed patterns and team feedback

## Next Steps

1. **Alert Notification Setup:** Configure alert notification channels (email, Slack, PagerDuty)
2. **On-call Rotation:** Set up an on-call rotation for responding to critical alerts
3. **Runbook Creation:** Develop runbooks for handling each type of alert scenario
4. **Dashboard Sharing:** Share dashboards with relevant team members and stakeholders 