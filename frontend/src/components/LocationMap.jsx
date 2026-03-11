/**
 * LocationMap.jsx - Interactive map component for PRAJA Grievance Portal
 * 
 * Uses OpenStreetMap + Leaflet.js (free, no API key needed)
 * Features:
 * - Draggable marker for precise location selection
 * - Reverse geocoding for address lookup
 * - Forward geocoding for address search
 * - GPS location detection
 * - AI location clues display
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, Search, Loader, Navigation, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom red marker icon
const redIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 30px;
      height: 42px;
      position: relative;
    ">
      <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <path d="M12 0C5.372 0 0 5.372 0 12c0 9 12 24 12 24s12-15 12-24c0-6.628-5.372-12-12-12z" fill="#EF4444"/>
        <circle cx="12" cy="12" r="6" fill="white"/>
        <circle cx="12" cy="12" r="3" fill="#EF4444"/>
      </svg>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42]
});

// Custom green marker icon (for confirmed locations)
const greenIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 30px;
      height: 42px;
      position: relative;
    ">
      <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <path d="M12 0C5.372 0 0 5.372 0 12c0 9 12 24 12 24s12-15 12-24c0-6.628-5.372-12-12-12z" fill="#22C55E"/>
        <circle cx="12" cy="12" r="6" fill="white"/>
        <path d="M9 12l2 2 4-4" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42]
});

/**
 * Reverse geocode coordinates to address using Nominatim
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'PRAJA-Grievance-Portal'
        }
      }
    );
    const data = await res.json();
    return {
      displayName: data.display_name,
      address: data.address,
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || '',
      state: data.address?.state || '',
      pincode: data.address?.postcode || '',
      road: data.address?.road || '',
      suburb: data.address?.suburb || data.address?.neighbourhood || ''
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Forward geocode search query to coordinates
 */
const searchAddress = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'PRAJA-Grievance-Portal'
        }
      }
    );
    return await res.json();
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};

/**
 * Component to handle map position updates
 */
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

/**
 * Component to handle draggable marker events
 */
function DraggableMarker({ position, onPositionChange, readonly, isConfirmed }) {
  const markerRef = useRef(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null && !readonly) {
        const { lat, lng } = marker.getLatLng();
        onPositionChange(lat, lng);
      }
    },
  };

  return (
    <Marker
      draggable={!readonly}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={isConfirmed ? greenIcon : redIcon}
    />
  );
}

/**
 * Main LocationMap Component
 */
export default function LocationMap({
  latitude = 17.385,
  longitude = 78.4867,
  address = '',
  aiLocationClues = null,
  onLocationChange,
  readonly = false,
  className = ''
}) {
  const [position, setPosition] = useState([latitude, longitude]);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [addressDetails, setAddressDetails] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Update address when it changes
  useEffect(() => {
    if (address) {
      setCurrentAddress(address);
    }
  }, [address]);

  // Handle marker drag end
  const handlePositionChange = useCallback(async (lat, lng) => {
    setPosition([lat, lng]);
    setIsConfirmed(false);
    
    // Reverse geocode to get new address
    const geoData = await reverseGeocode(lat, lng);
    if (geoData) {
      setCurrentAddress(geoData.displayName);
      setAddressDetails(geoData);
      
      // Call parent callback
      if (onLocationChange) {
        onLocationChange({
          lat,
          lng,
          address: geoData.displayName,
          city: geoData.city,
          state: geoData.state,
          pincode: geoData.pincode
        });
      }
    }
  }, [onLocationChange]);

  // Handle GPS location
  const handleGetGPSLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setPosition([lat, lng]);
        
        // Reverse geocode
        const geoData = await reverseGeocode(lat, lng);
        if (geoData) {
          setCurrentAddress(geoData.displayName);
          setAddressDetails(geoData);
          setIsConfirmed(true);
          
          if (onLocationChange) {
            onLocationChange({
              lat,
              lng,
              address: geoData.displayName,
              city: geoData.city,
              state: geoData.state,
              pincode: geoData.pincode
            });
          }
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Could not get your location. Please enable location access.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onLocationChange]);

  // Handle search debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchAddress(query);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search result selection
  const handleSelectSearchResult = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setPosition([lat, lng]);
    setCurrentAddress(result.display_name);
    setSearchQuery('');
    setShowSearchResults(false);
    setIsConfirmed(true);
    
    // Get detailed address info
    const geoData = await reverseGeocode(lat, lng);
    if (geoData) {
      setAddressDetails(geoData);
      
      if (onLocationChange) {
        onLocationChange({
          lat,
          lng,
          address: geoData.displayName,
          city: geoData.city,
          state: geoData.state,
          pincode: geoData.pincode
        });
      }
    }
  };

  // Build AI clues display
  const renderAIClues = () => {
    if (!aiLocationClues) return null;
    
    const clues = [];
    if (aiLocationClues.locationType && aiLocationClues.locationType !== 'unknown') {
      clues.push(aiLocationClues.locationType.replace(/_/g, ' '));
    }
    if (aiLocationClues.urbanRural && aiLocationClues.urbanRural !== 'unclear') {
      clues.push(aiLocationClues.urbanRural);
    }
    if (aiLocationClues.weatherCondition && aiLocationClues.weatherCondition !== 'unclear') {
      clues.push(`${aiLocationClues.weatherCondition} conditions`);
    }
    
    return clues.length > 0 ? clues.join(' · ') : null;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-teal font-semibold">
        <MapPin size={18} />
        <span>Complaint Location</span>
      </div>

      {/* Search Bar */}
      {!readonly && (
        <div className="relative">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <Search size={18} className="ml-3 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for an address..."
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
            {isSearching && <Loader size={18} className="mr-3 text-gray-400 animate-spin" />}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="p-2 hover:bg-gray-100"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-teal/5 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-teal mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-2">{result.display_name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '280px' }}>
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={position} />
          <DraggableMarker
            position={position}
            onPositionChange={handlePositionChange}
            readonly={readonly}
            isConfirmed={isConfirmed}
          />
          <Popup position={position}>
            <div className="text-sm min-w-[200px]">
              <div className="font-semibold text-teal mb-1">📍 Your Complaint Location</div>
              <div className="text-gray-600 text-xs mb-2 line-clamp-3">
                {currentAddress || 'Drag marker to set location'}
              </div>
              {aiLocationClues && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">🤖 AI Detected:</span>
                    <div className="text-gray-500 mt-1">
                      {renderAIClues()}
                    </div>
                    {aiLocationClues.nearbyLandmarks?.length > 0 && (
                      <div className="text-gray-500 mt-1">
                        📍 Near: {aiLocationClues.nearbyLandmarks.join(', ')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Popup>
        </MapContainer>
      </div>

      {/* Current Address Display */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Navigation size={16} className="text-teal mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 line-clamp-2">
              {currentAddress || 'Detecting location...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Lat: {position[0]?.toFixed(6)} · Lng: {position[1]?.toFixed(6)}
            </div>
          </div>
        </div>

        {/* GPS Button */}
        {!readonly && (
          <button
            onClick={handleGetGPSLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal/90 transition-colors disabled:opacity-60"
          >
            {isLocating ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Detecting location...</span>
              </>
            ) : (
              <>
                <Crosshair size={16} />
                <span>🎯 Use My GPS Location</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* AI Location Clues */}
      {aiLocationClues && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
            <span>🤖</span>
            <span>AI Location Intelligence</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiLocationClues.locationType && aiLocationClues.locationType !== 'unknown' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                📍 {aiLocationClues.locationType.replace(/_/g, ' ')}
              </span>
            )}
            {aiLocationClues.urbanRural && aiLocationClues.urbanRural !== 'unclear' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                🏙️ {aiLocationClues.urbanRural}
              </span>
            )}
            {aiLocationClues.weatherCondition && aiLocationClues.weatherCondition !== 'unclear' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {aiLocationClues.weatherCondition === 'wet' ? '🌧️' : '☀️'} {aiLocationClues.weatherCondition} conditions
              </span>
            )}
            {aiLocationClues.roadType && aiLocationClues.roadType !== 'unknown' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                🛣️ {aiLocationClues.roadType.replace(/_/g, ' ')}
              </span>
            )}
            {aiLocationClues.timeOfDay && aiLocationClues.timeOfDay !== 'unclear' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                🕐 {aiLocationClues.timeOfDay}
              </span>
            )}
          </div>
          {aiLocationClues.nearbyLandmarks?.length > 0 && (
            <div className="mt-2 text-xs text-blue-700">
              <span className="font-medium">🏪 Landmarks detected:</span>{' '}
              {aiLocationClues.nearbyLandmarks.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
