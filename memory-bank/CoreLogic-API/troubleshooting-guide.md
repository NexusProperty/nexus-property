# CoreLogic API Integration - Troubleshooting Guide

This guide provides solutions for common issues that may occur with the CoreLogic API integration. Use this as a reference when diagnosing problems with the integration.

## API Connection Issues

### Authentication Failures

**Symptoms:**
- Error messages containing "Authentication failed" or "Unauthorized"
- HTTP 401 responses from CoreLogic API
- `token.generate` errors in logs

**Troubleshooting Steps:**
1. Verify API credentials are correctly set in environment variables:
   ```bash
   # Check if credentials are set
   supabase secrets list | grep CORELOGIC
   ```

2. Check if token refresh is working:
   ```
   # Look for token refresh logs
   supabase logs functions --filter "token.refresh"
   ```

3. Test authentication directly:
   ```javascript
   // Run this in the test script
   const client = createCoreLogicClient({
     apiKey: process.env.CORELOGIC_API_KEY,
     apiSecret: process.env.CORELOGIC_API_SECRET,
     baseUrl: process.env.CORELOGIC_API_URL
   }, false, LogLevel.DEBUG);
   
   const tokenResult = await client.getAuthToken();
   console.log('Token result:', tokenResult ? 'Success' : 'Failed');
   ```

**Resolution:**
- Update API credentials if expired
- Check for CoreLogic API status issues
- Verify network connectivity to CoreLogic endpoints

### API Rate Limiting

**Symptoms:**
- HTTP 429 responses
- Error messages containing "Rate limit exceeded"
- Sudden increase in failed requests

**Troubleshooting Steps:**
1. Check API usage logs:
   ```
   # Look for rate limiting events
   supabase logs functions --filter "rate.limit"
   ```

2. Verify current usage against limits:
   ```
   # Run usage report script
   node scripts/corelogic-usage-report.js
   ```

**Resolution:**
- Implement additional client-side rate limiting
- Adjust batch sizes and concurrency
- Contact CoreLogic to increase limits if needed

## Data Quality Issues

### Missing Property Data

**Symptoms:**
- Incomplete property details
- Missing fields in property response
- Null values in expected fields

**Troubleshooting Steps:**
1. Run data validation tests:
   ```bash
   node memory-bank/CoreLogic-API/data-validation-tests.js
   ```

2. Check raw API responses:
   ```javascript
   // Add detailed logging for the specific property
   console.log(JSON.stringify({
     level: 'debug',
     message: 'Raw property attributes',
     data: await client.getPropertyAttributes(propertyId)
   }));
   ```

3. Verify property exists in CoreLogic database:
   ```javascript
   // Test address matching
   const matchResult = await client.matchAddress({
     address: '123 Problem Street',
     suburb: 'Problem Suburb',
     city: 'Problem City'
   });
   console.log('Match result:', matchResult);
   ```

**Resolution:**
- Add fallback values for missing fields
- Implement data quality checks in transformers
- Update validation to handle partial data

### Transformation Errors

**Symptoms:**
- Error messages containing "Error transforming property data"
- TypeScript errors in logs
- Unexpected data formats in responses

**Troubleshooting Steps:**
1. Run transformation tests with debug logging:
   ```javascript
   const result = createPropertyDataResponse(
     propertyId,
     propertyAttributes,
     addressDetails,
     salesHistory,
     avm,
     marketStats
   );
   console.log('Transformation result:', JSON.stringify(result, null, 2));
   ```

2. Check type compatibility:
   ```javascript
   console.log('Property attributes type check:',
     typeof propertyAttributes === 'object' &&
     propertyAttributes !== null &&
     'propertyId' in propertyAttributes
   );
   ```

**Resolution:**
- Update type definitions to match actual API responses
- Add additional validation in transformers
- Implement defensive programming with fallbacks

## Performance Issues

### Slow Response Times

**Symptoms:**
- Edge Function execution time > 1000ms
- Timeout errors
- Client-side performance complaints

**Troubleshooting Steps:**
1. Run benchmarks to identify bottlenecks:
   ```bash
   node memory-bank/CoreLogic-API/enhanced-benchmark.js
   ```

2. Check individual API endpoint performance:
   ```javascript
   // Time each API call separately
   const startTime = Date.now();
   const result = await client.getPropertyAttributes(propertyId);
   console.log(`getPropertyAttributes took ${Date.now() - startTime}ms`);
   ```

3. Monitor Supabase Edge Function metrics:
   ```bash
   supabase functions metrics property-data --days 7
   ```

**Resolution:**
- Optimize transformer functions
- Increase cache TTL for frequently accessed data
- Implement additional parallel processing
- Consider precomputing common requests

### Memory Usage Issues

**Symptoms:**
- Edge Function out of memory errors
- Increasing response times over time
- Error messages about heap limits

**Troubleshooting Steps:**
1. Check memory usage in benchmark tests:
   ```javascript
   console.log('Memory usage:', process.memoryUsage());
   ```

2. Monitor for memory leaks:
   ```javascript
   // Before operation
   const beforeMemory = process.memoryUsage().heapUsed;
   
   // Run operation multiple times
   for (let i = 0; i < 100; i++) {
     await someOperation();
   }
   
   // After operation
   const afterMemory = process.memoryUsage().heapUsed;
   console.log(`Memory change: ${(afterMemory - beforeMemory) / 1024 / 1024} MB`);
   ```

**Resolution:**
- Use optimized transformers for large datasets
- Implement streaming for large responses
- Add pagination for large result sets
- Optimize memory usage in batch operations

## Caching Issues

### Cache Miss Rate Too High

**Symptoms:**
- Low cache hit ratio in monitoring
- Increased API calls to CoreLogic
- Increased response times

**Troubleshooting Steps:**
1. Check cache hit/miss ratio:
   ```bash
   # Look for cache hit/miss logs
   supabase logs functions --filter "cache"
   ```

2. Verify TTL settings:
   ```javascript
   console.log('Current cache TTL:', process.env.CORELOGIC_CACHE_TTL);
   ```

**Resolution:**
- Increase cache TTL for stable data
- Add additional cache layers
- Implement smarter cache invalidation

### Stale Data

**Symptoms:**
- Outdated property information
- Property data not reflecting recent sales
- User complaints about data accuracy

**Troubleshooting Steps:**
1. Check when data was last refreshed:
   ```sql
   -- Query cache table for last refresh
   SELECT * FROM cache.property_data 
   WHERE property_id = 'PROBLEM-ID'
   ORDER BY updated_at DESC LIMIT 1;
   ```

2. Verify cache is being invalidated correctly:
   ```javascript
   // Test cache invalidation
   await supabaseClient
     .from('cache.property_data')
     .delete()
     .eq('property_id', propertyId);
   ```

**Resolution:**
- Adjust cache TTL for time-sensitive data
- Implement cache invalidation triggers
- Add force refresh option for users

## Integration Errors

### Edge Function Deployment Issues

**Symptoms:**
- Failed deployments
- Function not updating after deployment
- Unexpected function behavior

**Troubleshooting Steps:**
1. Check deployment logs:
   ```bash
   supabase functions logs property-data
   ```

2. Verify function configuration:
   ```bash
   supabase functions inspect property-data
   ```

3. Test function locally:
   ```bash
   supabase functions serve property-data --env-file .env.local
   ```

**Resolution:**
- Address any TypeScript errors
- Verify environment variables are set correctly
- Check for dependency conflicts

### Circuit Breaker Activations

**Symptoms:**
- Logs showing "Circuit breaker open"
- Fallback to mock data
- Temporary service degradation

**Troubleshooting Steps:**
1. Check circuit breaker status:
   ```bash
   # Look for circuit breaker events
   supabase logs functions --filter "circuit.breaker"
   ```

2. Verify CoreLogic API status:
   ```bash
   # Use status check endpoint
   curl -I https://api.corelogic.asia/status
   ```

**Resolution:**
- Manually reset circuit breaker if needed
- Extend circuit breaker timeout if transient issues
- Implement more gradual fallback mechanisms

## Batch Processing Issues

### Batch Failures

**Symptoms:**
- Partial batch results
- Timeout errors on large batches
- Error messages about concurrency limits

**Troubleshooting Steps:**
1. Test with smaller batch sizes:
   ```javascript
   // Reduce batch size
   const results = await batchProcessProperties(
     propertyIds.slice(0, 3),
     fetchPropertyAttributes,
     fetchSalesHistory,
     fetchAVM,
     fetchMarketStats
   );
   ```

2. Monitor concurrency:
   ```javascript
   let activeRequests = 0;
   console.log('Active requests:', activeRequests);
   ```

**Resolution:**
- Adjust batch sizes based on performance
- Optimize concurrency limits
- Implement backpressure mechanisms

## Debugging Techniques

### Enable Verbose Logging

```javascript
// Set log level to DEBUG
const client = createCoreLogicClient(
  config,
  false,
  LogLevel.DEBUG
);
```

### Capture Full Request/Response Cycles

```javascript
// Add request/response logging middleware
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log(`Request: ${url}`, options);
  const response = await originalFetch(url, options);
  console.log(`Response: ${url}`, {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    // Clone to avoid consuming the response
    body: await response.clone().text().catch(() => 'Cannot read body')
  });
  return response;
};
```

### Test Specific Components

```javascript
// Test transformers with mock data
const mockPropertyAttributes = { /* ... */ };
const result = transformPropertyDetails(
  'TEST-ID',
  mockPropertyAttributes,
  { address: '123 Test St', addressComponents: { suburb: 'Test', city: 'Test' } }
);
console.log('Transformer result:', result);
```

## Contact Information

For issues that cannot be resolved using this guide:

1. **CoreLogic API Support**:
   - Email: api-support@corelogic.com
   - Support Portal: https://developer.corelogic.asia/support

2. **Internal Support**:
   - Development Team: dev-team@nexusproperty.com
   - Slack Channel: #corelogic-integration

## Reporting Bugs

When reporting issues, include the following information:

1. Description of the problem
2. Steps to reproduce
3. Expected vs. actual behavior
4. Relevant logs
5. Environment information (production/staging/dev)
6. Request IDs if available
7. Timestamp of the error 