# Supabase Edge Functions

This directory contains the Supabase Edge Functions for the AppraisalHub platform.

## Functions

### Property Data (`/property-data`)

This Edge Function retrieves property data, including property details, comparable properties, and market trends. It serves as a bridge between external property data APIs and the AppraisalHub platform.

#### Request Format

```json
{
  "address": "123 Main Street",
  "suburb": "Example Suburb",
  "city": "Example City",
  "propertyType": "house"
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "propertyDetails": {
      "address": "123 Main Street",
      "suburb": "Example Suburb",
      "city": "Example City",
      "postcode": "1010",
      "propertyType": "house",
      "bedrooms": 3,
      "bathrooms": 2,
      "landSize": 650,
      "floorArea": 180,
      "yearBuilt": 2005,
      "features": ["Garage", "Garden", "Renovated Kitchen"]
    },
    "comparableProperties": [
      {
        "address": "21 Sample Street",
        "suburb": "Example Suburb",
        "city": "Example City",
        "propertyType": "house",
        "bedrooms": 3,
        "bathrooms": 2,
        "landSize": 620,
        "floorArea": 175,
        "yearBuilt": 2007,
        "saleDate": "2023-11-15",
        "salePrice": 950000,
        "similarityScore": 95,
        "imageUrl": "https://example.com/image1.jpg"
      },
      // Additional comparable properties...
    ],
    "marketTrends": {
      "medianPrice": 980000,
      "annualGrowth": 5.2,
      "salesVolume": 45,
      "daysOnMarket": 28
    }
  }
}
```

### Property Valuation (`/property-valuation`)

This Edge Function calculates property valuations based on comparable properties and market data. It uses a hybrid approach that combines weighted averages with statistical methods for outlier detection and confidence scoring.

#### Request Format

```json
{
  "appraisalId": "123e4567-e89b-12d3-a456-426614174000",
  "propertyDetails": {
    "address": "123 Main Street",
    "suburb": "Example Suburb",
    "city": "Example City",
    "propertyType": "house",
    "bedrooms": 3,
    "bathrooms": 2,
    "landSize": 650,
    "floorArea": 180,
    "yearBuilt": 2005
  },
  "comparableProperties": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "address": "125 Main Street",
      "suburb": "Example Suburb",
      "city": "Example City",
      "propertyType": "house",
      "bedrooms": 3,
      "bathrooms": 2,
      "landSize": 620,
      "floorArea": 175,
      "yearBuilt": 2007,
      "saleDate": "2023-11-15",
      "salePrice": 950000,
      "similarityScore": 95,
      "distanceKm": 0.5
    },
    // Additional comparable properties...
  ]
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "valuationLow": 920000,
    "valuationHigh": 980000,
    "valuationConfidence": 0.85,
    "adjustedComparables": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "address": "125 Main Street",
        "salePrice": 950000,
        "adjustedPrice": 945000,
        "adjustmentFactor": 0.995,
        "weight": 0.45,
        "isOutlier": false
      },
      // Additional adjusted comparables...
    ],
    "valuationFactors": {
      "bedroomValue": 310000,
      "landSizeValue": 1450,
      "floorAreaValue": 5200
    },
    "marketTrends": {
      "medianPrice": 950000,
      "pricePerSqm": 5400,
      "annualGrowth": 0.05
    }
  }
}
```

#### Algorithm Details

The valuation algorithm:

1. Detects outliers using the Interquartile Range (IQR) method
2. Calculates adjusted prices for each comparable based on:
   - Bedroom and bathroom differences
   - Land size and floor area differences
   - Property age/year built
   - Property type
   - Recency of sale (with market growth adjustment)
3. Applies weights based on:
   - Similarity score (40% weight)
   - Recency of sale (30% weight)
   - Distance/location proximity (30% weight)
4. Calculates the final valuation using a weighted combination of median and mean prices
5. Determines valuation range width based on data consistency
6. Calculates a confidence score based on multiple factors

#### Authentication

The function requires a valid JWT token in the `Authorization` header with the format `Bearer <token>`. The token is verified using Supabase authentication.

#### Error Handling

Errors are returned in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Deployment

To deploy the Edge Functions to your Supabase project:

```bash
supabase functions deploy property-data
supabase functions deploy property-valuation
```

## Local Development

To run the Edge Functions locally:

```bash
supabase start
supabase functions serve property-data
supabase functions serve property-valuation
```

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project

### Setting Environment Variables

```bash
supabase secrets set SOME_SECRET=some_value
```

## Security Considerations

- The `SUPABASE_SERVICE_ROLE_KEY` has full access to your Supabase project, bypassing RLS policies. Use it carefully and only when necessary.
- Always validate user input to prevent injection attacks.
- Implement proper error handling to avoid leaking sensitive information.
- Use structured logging to facilitate debugging and monitoring.
- Review RLS policies to ensure proper data access control. 