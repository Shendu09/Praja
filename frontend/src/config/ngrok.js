// ngrok Configuration for QR Code URLs
// =====================================
//
// SETUP INSTRUCTIONS:
// 1. Run: ngrok http 5173
// 2. Copy the https URL ngrok gives you (e.g. https://abc123.ngrok-free.app)
// 3. Create/Update frontend/.env file with:
//    VITE_NGROK_URL=https://your-ngrok-url.ngrok-free.app
// 4. Restart your frontend dev server (npm run dev)
//
// NOTE: Free ngrok URL changes every restart, so update .env each time

// Your local network IP (for same WiFi testing)
const LOCAL_NETWORK_IP = '192.168.29.99';

// Get the base URL for QR codes
export const getBaseUrl = () => {
  // First priority: ngrok URL from environment
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  
  // Second priority: current origin (works when accessed via ngrok directly)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If we're already on ngrok, use that URL
    if (origin.includes('ngrok')) {
      return origin;
    }
  }
  
  // Third priority: Use local network IP for same WiFi testing
  return `http://${LOCAL_NETWORK_IP}:5173`;
};

// Build the rating URL for QR codes
export const buildRatingUrl = (serviceId) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/rate/${serviceId}`;
};

// Check if we're running on ngrok
export const isNgrokEnvironment = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin.includes('ngrok');
  }
  return false;
};

// Get a displayable URL (shortened for UI)
export const getDisplayUrl = (serviceId) => {
  const fullUrl = buildRatingUrl(serviceId);
  // Shorten for display
  if (fullUrl.length > 50) {
    return fullUrl.substring(0, 47) + '...';
  }
  return fullUrl;
};

export default {
  getBaseUrl,
  buildRatingUrl,
  isNgrokEnvironment,
  getDisplayUrl
};
