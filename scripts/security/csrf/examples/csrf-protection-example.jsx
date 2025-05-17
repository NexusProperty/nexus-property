import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

// Example component showing how to use CSRF tokens in a form
const PropertyForm = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [csrfToken, setCsrfToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    suburb: '',
    city: '',
    property_type: 'House',
    bedrooms: 3,
    bathrooms: 2
  });

  // Fetch a CSRF token when the component mounts
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const { data, error } = await supabase.rpc('generate_csrf_token');
        
        if (error) {
          throw error;
        }
        
        setCsrfToken(data);
      } catch (err) {
        console.error('Error generating CSRF token:', err.message);
        setError('Failed to secure form. Please try again later.');
      }
    };

    if (user) {
      fetchCsrfToken();
    }
  }, [supabase, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Ensure we have a CSRF token
      if (!csrfToken) {
        throw new Error('Security token missing. Please refresh the page.');
      }
      
      // Submit form data with CSRF token in the header
      const { data, error } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          ...formData,
          status: 'active'
        })
        .select()
        .headers({
          // Include the CSRF token in the header
          'x-csrf-token': csrfToken
        });
      
      if (error) {
        throw error;
      }
      
      // Success! Clear form
      setSuccess(true);
      setFormData({
        address: '',
        suburb: '',
        city: '',
        property_type: 'House',
        bedrooms: 3,
        bathrooms: 2
      });
      
      // Generate a new token for next submission
      const { data: newToken, error: tokenError } = await supabase.rpc('generate_csrf_token');
      if (tokenError) {
        console.error('Error refreshing CSRF token:', tokenError.message);
      } else {
        setCsrfToken(newToken);
      }
      
    } catch (err) {
      console.error('Error submitting form:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please sign in to add a property</div>;
  }

  return (
    <div className="property-form">
      <h2>Add New Property</h2>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          Property added successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="suburb">Suburb</label>
          <input
            type="text"
            id="suburb"
            name="suburb"
            value={formData.suburb}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="property_type">Property Type</label>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleInputChange}
            required
          >
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Land">Land</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="bedrooms">Bedrooms</label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bathrooms">Bathrooms</label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            min="0"
            step="0.5"
            required
          />
        </div>
        
        {/* Hidden field with CSRF token - not actually needed since we're sending in header */}
        <input type="hidden" name="csrf_token" value={csrfToken} />
        
        <button 
          type="submit" 
          disabled={isLoading || !csrfToken}
          className="submit-button"
        >
          {isLoading ? 'Submitting...' : 'Add Property'}
        </button>
      </form>
    </div>
  );
};

export default PropertyForm; 