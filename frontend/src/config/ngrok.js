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

// Get the base URL for QR codes
// Automatically uses the current browser origin, so QR codes work
// on any phone on the same WiFi — no manual IP configuration needed.
export const getBaseUrl = () => {
  // First priority: ngrok URL from environment
  if (import.meta.env.VITE_NGROK_URL && String(import.meta.env.VITE_NGROK_URL).trim()) {
    return String(import.meta.env.VITE_NGROK_URL).trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // If already on a LAN IP, ngrok, or deployed domain — use as-is
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return String(origin).replace(/\/$/, '');
    }

    // On localhost: QR codes must use the machine's LAN IP so other
    // phones on the same WiFi can reach the dev server.
    // We inject this at build time via VITE_LAN_IP, or fall back to
    // a runtime WebRTC-based detection saved earlier.
    const lanIp = import.meta.env.VITE_LAN_IP || window.__PRAJA_LAN_IP;
    if (lanIp) {
      return `http://${lanIp}:${window.location.port || '5173'}`.replace(/\/$/, '');
    }

    // Last resort: try to detect via the RTCPeerConnection trick
    // and cache the result for subsequent calls.
    detectLanIp();

    // While detection runs asynchronously, return origin (localhost).
    // The user will see a banner suggesting they open via LAN IP.
    return String(origin).replace(/\/$/, '');
  }

  return 'http://localhost:5173'.replace(/\/$/, '');
};

// Async LAN IP detection using WebRTC (works in most browsers)
let _detecting = false;
export const detectLanIp = () => {
  if (_detecting || typeof window === 'undefined') return;
  if (window.__PRAJA_LAN_IP) return;
  _detecting = true;

  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    pc.onicecandidate = (e) => {
      if (!e || !e.candidate || !e.candidate.candidate) return;
      const match = e.candidate.candidate.match(
        /([0-9]{1,3}\.){3}[0-9]{1,3}/
      );
      if (match) {
        const ip = match[0];
        if (ip !== '0.0.0.0' && !ip.startsWith('127.')) {
          window.__PRAJA_LAN_IP = ip;
          console.log('[Praja] Detected LAN IP:', ip);
        }
      }
      pc.close();
      _detecting = false;
    };
  } catch {
    _detecting = false;
  }
};

// Build the rating URL for QR codes
export const buildRatingUrl = (serviceId) => {
  const baseUrl = String(getBaseUrl()).replace(/\/$/, '');
  return `${baseUrl}/rate/${serviceId}`;
};

export const hasNgrokConfigured = () => {
  return Boolean(import.meta.env.VITE_NGROK_URL && String(import.meta.env.VITE_NGROK_URL).trim());
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
  hasNgrokConfigured,
  isNgrokEnvironment,
  getDisplayUrl
};
