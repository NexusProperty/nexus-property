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
```

## Local Development

To run the Edge Functions locally:

```bash
supabase start
supabase functions serve property-data
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