# CoreLogic API Integration - Production Deployment Guide

This document outlines the steps required to deploy the CoreLogic API integration to production, including configuration, monitoring, and maintenance procedures.

## Prerequisites

Before deploying to production, ensure the following prerequisites are met:

1. Successful completion of sandbox testing with actual CoreLogic API
2. Production API credentials obtained from CoreLogic
3. Approval from security team for integration
4. Sign-off on performance testing results

## Deployment Steps

### 1. Configure Production Environment

#### Environment Variables

Set up the following environment variables in your production environment:

```
CORELOGIC_API_KEY=your-production-api-key
CORELOGIC_API_SECRET=your-production-api-secret
CORELOGIC_API_URL=https://api.corelogic.asia
CORELOGIC_USE_MOCK=false
CORELOGIC_CACHE_TTL=3600
CORELOGIC_BATCH_SIZE=5
CORELOGIC_CONCURRENCY_LIMIT=5
CORELOGIC_MAX_RETRIES=3
```

#### Supabase Edge Function Deployment

1. Update Edge Function with production configuration:

```bash
supabase functions deploy property-data --no-verify-jwt
```

2. Set production secrets:

```bash
supabase secrets set CORELOGIC_API_KEY=your-production-api-key
supabase secrets set CORELOGIC_API_SECRET=your-production-api-secret
```

### 2. Implement Monitoring

#### Logging

Ensure structured JSON logging is enabled in all components:

1. Verify `LogLevel.INFO` is set for production
2. Confirm all critical operations have appropriate logging
3. Set up log retention and analysis

#### Alerting

Configure alerts for the following scenarios:

1. API authentication failures
2. Elevated error rates (>1% of total requests)
3. Response time exceeding thresholds (>2000ms)
4. Rate limiting events from CoreLogic API
5. Cache hit ratio dropping below 70%

#### Dashboard

Create a monitoring dashboard with the following metrics:

1. API call volume by endpoint
2. Response time percentiles (50th, 95th, 99th)
3. Error rates
4. Cache hit ratio
5. Token expiration events

### 3. Configure Rate Limiting

Implement client-side rate limiting to avoid exceeding CoreLogic API quotas:

1. Configure maximum requests per minute based on CoreLogic's rate limits
2. Implement token bucket algorithm in `corelogic-service.ts`
3. Add circuit breaker pattern for API outages

### 4. Gradual Rollout Strategy

#### Step 1: Feature Flag Setup

Create feature flags for the following components:

- `enable_corelogic_property_data`: Controls whether to use CoreLogic or mock data
- `enable_corelogic_market_stats`: Controls whether to use CoreLogic for market statistics
- `enable_corelogic_optimized_transformers`: Controls whether to use standard or optimized transformers

#### Step 2: Canary Deployment

1. Enable CoreLogic integration for 5% of requests
2. Monitor error rates and performance
3. If stable for 24 hours, increase to 20%
4. Continue gradual rollout: 50% → 80% → 100%

#### Step 3: Rollback Plan

In case of issues, implement the following rollback strategy:

1. Set feature flags to disable CoreLogic integration
2. Revert to mock data implementation
3. Analyze logs to identify root cause
4. Fix issues and retry deployment

### 5. Performance Tuning

#### Caching Strategy

Implement the following caching strategy:

1. Property details: 24-hour TTL
2. Market statistics: 7-day TTL
3. Sales history: 30-day TTL
4. Images: 30-day TTL

#### Request Optimization

1. Configure optimal batch sizes based on production metrics
2. Adjust concurrency limits based on observed API response times
3. Fine-tune retry parameters based on error patterns

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Weekly**:
   - Review API usage and error rates
   - Verify token refresh is working correctly
   - Check for rate limiting events

2. **Monthly**:
   - Review performance metrics
   - Optimize caching parameters
   - Update benchmark tests with real-world data

3. **Quarterly**:
   - Review CoreLogic API changes/updates
   - Update integration if needed
   - Perform comprehensive testing

### API Outage Procedure

In case of CoreLogic API outage:

1. Verify outage is not due to authentication/credentials
2. Implement circuit breaker to prevent cascading failures
3. Fall back to cached data with extended TTL
4. Notify users of potential data staleness
5. Monitor CoreLogic status updates
6. Resume normal operation once API is restored

### API Version Updates

When CoreLogic updates their API:

1. Review change documentation
2. Update type definitions and transformers
3. Test in sandbox environment
4. Deploy changes to staging
5. Monitor for issues
6. Deploy to production

## Security Considerations

1. **Credential Management**:
   - Store API credentials securely in Supabase secrets
   - Rotate credentials quarterly
   - Monitor for unauthorized access

2. **Data Protection**:
   - Ensure sensitive property data is protected
   - Implement proper access controls
   - Follow data retention policies

3. **Audit Logging**:
   - Maintain logs of all API access
   - Track usage patterns for anomaly detection

## Cost Management

1. **API Usage Monitoring**:
   - Track daily/weekly/monthly API call volume
   - Set up alerts for unusual usage patterns
   - Optimize requests to reduce costs

2. **Optimization Strategies**:
   - Maximize cache usage
   - Batch requests where possible
   - Implement smart request deduplication

## Documentation

Ensure the following documentation is updated:

1. API integration reference
2. Troubleshooting guide
3. Monitoring dashboard instructions
4. Rollback procedures
5. Emergency contact information

## Support Procedures

1. **First-Level Support**:
   - Check logs for error patterns
   - Verify API credentials and connectivity
   - Check CoreLogic service status

2. **Second-Level Support**:
   - Analyze detailed logs
   - Review recent code changes
   - Test in sandbox environment

3. **Escalation Path**:
   - CoreLogic API support contact
   - Development team leads
   - Infrastructure team 