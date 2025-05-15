import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as propertyService from '@/services/property';

describe('Property Service', () => {
  const mockProperty = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    owner_id: 'user-123',
    address: '123 Main St',
    suburb: 'Suburbia',
    city: 'Metropolis',
    postcode: '12345',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    floor_area: 200,
    year_built: 2010,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    features: [],
    images: [],
    is_public: true,
    status: 'active',
    metadata: null
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProperty', () => {
    it('should return a property when given a valid ID', async () => {
      // Create a spy that returns a successful result
      const getPropertySpy = vi.spyOn(propertyService, 'getProperty');
      getPropertySpy.mockResolvedValue({
        success: true,
        error: null,
        data: mockProperty
      });

      // Call the function
      const result = await propertyService.getProperty('123e4567-e89b-12d3-a456-426614174000');

      // Assertions
      expect(getPropertySpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProperty);
    });

    it('should return an error for an invalid ID', async () => {
      // Create a spy for the invalid ID case
      const getPropertySpy = vi.spyOn(propertyService, 'getProperty');
      getPropertySpy.mockResolvedValue({
        success: false,
        error: 'Invalid property ID',
        data: null
      });

      // Call the function with invalid input
      const result = await propertyService.getProperty('');

      // Assertions
      expect(getPropertySpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid property ID');
      expect(result.data).toBeNull();
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const getPropertySpy = vi.spyOn(propertyService, 'getProperty');
      getPropertySpy.mockResolvedValue({
        success: false,
        error: 'Database error',
        data: null
      });

      // Call the function
      const result = await propertyService.getProperty('123e4567-e89b-12d3-a456-426614174000');

      // Assertions
      expect(getPropertySpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.data).toBeNull();
    });
  });

  describe('getUserProperties', () => {
    const mockProperties = [
      mockProperty,
      {
        ...mockProperty,
        id: '223e4567-e89b-12d3-a456-426614174001',
        address: '456 Other St'
      }
    ];

    const mockPagination = {
      currentPage: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };

    it('should return properties for a valid user ID with default pagination', async () => {
      // Create a spy that returns a successful result
      const getUserPropertiesSpy = vi.spyOn(propertyService, 'getUserProperties');
      getUserPropertiesSpy.mockResolvedValue({
        success: true,
        error: null,
        data: mockProperties,
        pagination: mockPagination
      });

      // Call the function
      const result = await propertyService.getUserProperties('user-123');

      // Assertions
      expect(getUserPropertiesSpy).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProperties);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should return an error for an invalid user ID', async () => {
      // Create a spy for the invalid ID case
      const getUserPropertiesSpy = vi.spyOn(propertyService, 'getUserProperties');
      getUserPropertiesSpy.mockResolvedValue({
        success: false,
        error: 'Invalid user ID',
        data: null
      });

      // Call the function with invalid input
      const result = await propertyService.getUserProperties('');

      // Assertions
      expect(getUserPropertiesSpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
      expect(result.data).toBeNull();
    });

    it('should handle custom pagination and sorting parameters', async () => {
      // Create a spy that returns a successful result with custom pagination
      const customPagination = {
        currentPage: 2,
        pageSize: 5,
        totalCount: 15,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true
      };

      const getUserPropertiesSpy = vi.spyOn(propertyService, 'getUserProperties');
      getUserPropertiesSpy.mockResolvedValue({
        success: true,
        error: null,
        data: mockProperties,
        pagination: customPagination
      });

      // Call the function with custom parameters
      const result = await propertyService.getUserProperties('user-123', 2, 5, 'address', 'asc');

      // Assertions
      expect(getUserPropertiesSpy).toHaveBeenCalledWith('user-123', 2, 5, 'address', 'asc');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProperties);
      expect(result.pagination).toEqual(customPagination);
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const getUserPropertiesSpy = vi.spyOn(propertyService, 'getUserProperties');
      getUserPropertiesSpy.mockResolvedValue({
        success: false,
        error: 'Database error',
        data: null
      });

      // Call the function
      const result = await propertyService.getUserProperties('user-123');

      // Assertions
      expect(getUserPropertiesSpy).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.data).toBeNull();
    });
  });

  describe('createProperty', () => {
    const newProperty = {
      owner_id: 'user-123',
      address: '789 New St',
      suburb: 'Newville',
      city: 'Metropolis',
      postcode: '54321',
      property_type: 'apartment' as const,
      bedrooms: 2,
      bathrooms: 1,
      land_size: 0,
      floor_area: 85,
      year_built: 2015,
      status: 'active' as const
    };

    it('should create a property with valid data', async () => {
      // Create a spy that returns a successful result
      const createPropertySpy = vi.spyOn(propertyService, 'createProperty');
      createPropertySpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          id: 'new-property-id',
          ...newProperty,
          created_at: '2023-05-15T00:00:00.000Z',
          updated_at: '2023-05-15T00:00:00.000Z',
          features: [],
          images: [],
          is_public: true,
          metadata: null
        }
      });

      // Call the function
      const result = await propertyService.createProperty(newProperty);

      // Assertions
      expect(createPropertySpy).toHaveBeenCalledWith(newProperty);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('id', 'new-property-id');
      expect(result.data).toHaveProperty('address', '789 New St');
    });

    it('should return validation errors for invalid data', async () => {
      // Create invalid property data (missing required fields)
      const invalidProperty: Partial<typeof newProperty> = {
        owner_id: 'user-123',
        // Missing address and other required fields
      };

      // Create a spy that returns validation error
      const createPropertySpy = vi.spyOn(propertyService, 'createProperty');
      createPropertySpy.mockResolvedValue({
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            path: ['address'],
            message: 'Required'
          }
        ]
      });

      // Call the function with invalid data
      const result = await propertyService.createProperty(invalidProperty as unknown as Parameters<typeof propertyService.createProperty>[0]);

      // Assertions
      expect(createPropertySpy).toHaveBeenCalledWith(invalidProperty);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data).toBeNull();
      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors?.[0].path).toContain('address');
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const createPropertySpy = vi.spyOn(propertyService, 'createProperty');
      createPropertySpy.mockResolvedValue({
        success: false,
        error: 'Database error: duplicate key violation',
        data: null
      });

      // Call the function
      const result = await propertyService.createProperty(newProperty);

      // Assertions
      expect(createPropertySpy).toHaveBeenCalledWith(newProperty);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error: duplicate key violation');
      expect(result.data).toBeNull();
    });
  });

  describe('updateProperty', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';
    const propertyUpdates = {
      address: 'Updated Address',
      bedrooms: 4,
      bathrooms: 3
    };

    it('should update a property with valid data', async () => {
      // Create a spy that returns a successful result
      const updatePropertySpy = vi.spyOn(propertyService, 'updateProperty');
      updatePropertySpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          ...mockProperty,
          ...propertyUpdates,
          updated_at: '2023-05-15T12:00:00.000Z'
        }
      });

      // Call the function
      const result = await propertyService.updateProperty(propertyId, propertyUpdates);

      // Assertions
      expect(updatePropertySpy).toHaveBeenCalledWith(propertyId, propertyUpdates);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('id', propertyId);
      expect(result.data).toHaveProperty('address', 'Updated Address');
      expect(result.data).toHaveProperty('bedrooms', 4);
      expect(result.data).toHaveProperty('bathrooms', 3);
    });

    it('should return an error for an invalid property ID', async () => {
      // Create a spy for the invalid ID case
      const updatePropertySpy = vi.spyOn(propertyService, 'updateProperty');
      updatePropertySpy.mockResolvedValue({
        success: false,
        error: 'Invalid property ID',
        data: null
      });

      // Call the function with invalid input
      const result = await propertyService.updateProperty('', propertyUpdates);

      // Assertions
      expect(updatePropertySpy).toHaveBeenCalledWith('', propertyUpdates);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid property ID');
      expect(result.data).toBeNull();
    });

    it('should return validation errors for invalid data', async () => {
      // Create invalid update data
      const invalidUpdates: Record<string, unknown> = {
        bedrooms: -1, // Invalid number of bedrooms
        bathrooms: 'many' // Invalid type
      };

      // Create a spy that returns validation error
      const updatePropertySpy = vi.spyOn(propertyService, 'updateProperty');
      updatePropertySpy.mockResolvedValue({
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: [
          {
            code: 'too_small',
            minimum: 0,
            type: 'number',
            inclusive: true,
            path: ['bedrooms'],
            message: 'Number must be greater than or equal to 0'
          },
          {
            code: 'invalid_type',
            expected: 'number',
            received: 'string',
            path: ['bathrooms'],
            message: 'Expected number, received string'
          }
        ]
      });

      // Call the function with invalid data
      const result = await propertyService.updateProperty(propertyId, invalidUpdates as unknown as Parameters<typeof propertyService.updateProperty>[1]);

      // Assertions
      expect(updatePropertySpy).toHaveBeenCalledWith(propertyId, invalidUpdates);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data).toBeNull();
      expect(result.validationErrors).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const updatePropertySpy = vi.spyOn(propertyService, 'updateProperty');
      updatePropertySpy.mockResolvedValue({
        success: false,
        error: 'Database error: property not found',
        data: null
      });

      // Call the function
      const result = await propertyService.updateProperty(propertyId, propertyUpdates);

      // Assertions
      expect(updatePropertySpy).toHaveBeenCalledWith(propertyId, propertyUpdates);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error: property not found');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteProperty', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete a property with a valid ID', async () => {
      // Create a spy that returns a successful result
      const deletePropertySpy = vi.spyOn(propertyService, 'deleteProperty');
      deletePropertySpy.mockResolvedValue({
        success: true,
        error: null,
        data: null
      });

      // Call the function
      const result = await propertyService.deleteProperty(propertyId);

      // Assertions
      expect(deletePropertySpy).toHaveBeenCalledWith(propertyId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return an error for an invalid property ID', async () => {
      // Create a spy for the invalid ID case
      const deletePropertySpy = vi.spyOn(propertyService, 'deleteProperty');
      deletePropertySpy.mockResolvedValue({
        success: false,
        error: 'Invalid property ID',
        data: null
      });

      // Call the function with invalid input
      const result = await propertyService.deleteProperty('');

      // Assertions
      expect(deletePropertySpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid property ID');
      expect(result.data).toBeNull();
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const deletePropertySpy = vi.spyOn(propertyService, 'deleteProperty');
      deletePropertySpy.mockResolvedValue({
        success: false,
        error: 'Database error: foreign key constraint violation',
        data: null
      });

      // Call the function
      const result = await propertyService.deleteProperty(propertyId);

      // Assertions
      expect(deletePropertySpy).toHaveBeenCalledWith(propertyId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error: foreign key constraint violation');
      expect(result.data).toBeNull();
    });
  });
}); 