// Geolocation and reverse geocoding service

/**
 * Get current position using browser's Geolocation API
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get address using OpenStreetMap Nominatim API (free)
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'PRAJAApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    // Extract address components
    const address = data.address || {};
    
    return {
      full: data.display_name || 'Address not found',
      formatted: formatAddress(address),
      street: address.road || address.street || '',
      area: address.suburb || address.neighbourhood || address.hamlet || '',
      city: address.city || address.town || address.village || address.county || '',
      district: address.state_district || address.district || '',
      state: address.state || '',
      country: address.country || 'India',
      pincode: address.postcode || '',
      plusCode: generatePlusCode(latitude, longitude)
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return fallback with coordinates
    return {
      full: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      formatted: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
      street: '',
      area: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      pincode: '',
      plusCode: generatePlusCode(latitude, longitude)
    };
  }
};

/**
 * Format address from components
 */
const formatAddress = (address) => {
  const parts = [];
  
  if (address.road || address.street) {
    parts.push(address.road || address.street);
  }
  if (address.suburb || address.neighbourhood) {
    parts.push(address.suburb || address.neighbourhood);
  }
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  if (address.state_district) {
    parts.push(address.state_district);
  }
  if (address.state) {
    parts.push(address.state);
  }
  if (address.postcode) {
    parts.push(address.postcode);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Location detected';
};

/**
 * Generate a Plus Code (Open Location Code) approximation
 */
const generatePlusCode = (lat, lng) => {
  // Simplified plus code generation
  const latCode = Math.floor((lat + 90) * 8000).toString(20).toUpperCase().slice(0, 4);
  const lngCode = Math.floor((lng + 180) * 8000).toString(20).toUpperCase().slice(0, 4);
  return `${latCode}+${lngCode}`;
};

/**
 * Watch position for continuous updates
 */
export const watchPosition = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation not supported'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      errorCallback(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
};

/**
 * Clear position watch
 */
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Get location with full address (combines getCurrentPosition and reverseGeocode)
 */
export const getLocationWithAddress = async () => {
  const position = await getCurrentPosition();
  const address = await reverseGeocode(position.latitude, position.longitude);
  
  return {
    coordinates: [position.longitude, position.latitude], // GeoJSON format
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: position.accuracy,
    ...address
  };
};

export default {
  getCurrentPosition,
  reverseGeocode,
  watchPosition,
  clearWatch,
  getLocationWithAddress
};
