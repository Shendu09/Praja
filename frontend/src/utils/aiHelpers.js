/**
 * aiHelpers.js - Advanced AI helper utilities for PRAJA Grievance Portal
 * 
 * Handles MIME type detection, Base64 conversion, JSON parsing,
 * image quality validation, retry logic, and severity predictions.
 */

/**
 * Detect correct MIME type from file extension
 * Fixes issues with screenshots and various image formats
 * @param {File} file - The image file
 * @returns {string} - Correct MIME type
 */
export const getMimeType = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  };
  return types[ext] || file.type || 'image/jpeg';
};

/**
 * Convert file to Base64 string (without data URL prefix)
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    // Extract only the base64 data, removing the data URL prefix
    const base64Data = result.split(',')[1];
    resolve(base64Data);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

/**
 * Parse Gemini response safely - handles markdown wrapping and various formats
 * @param {string} text - Raw response text from Gemini
 * @returns {Object} - Parsed JSON object
 */
export const parseGeminiJSON = (text) => {
  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^\s*json\s*/i, '')
    .trim();

  // Try to extract JSON object if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Parse the JSON
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error, '\nCleaned text:', cleaned);
    throw new Error('Failed to parse AI response as JSON');
  }
};

/**
 * Client-side image quality check before sending to API
 * @param {File} file - The image file
 * @returns {Promise<{valid: boolean, warnings: string[]}>}
 */
export const checkImageQuality = (file) => new Promise((resolve) => {
  const img = new Image();
  const warnings = [];

  img.onload = () => {
    // Check minimum dimensions
    if (img.width < 100 || img.height < 100) {
      warnings.push('Image is too small (min 100x100 pixels). Please use a clearer photo.');
    }

    // Check file size - too small might indicate low quality
    if (file.size < 5000) {
      warnings.push('Image file size is very small. Quality may be low.');
    }

    // Check for extremely large images
    if (img.width > 4096 || img.height > 4096) {
      warnings.push('Image is very large. Processing may take longer.');
    }

    // Check aspect ratio - extreme ratios may indicate cropped/partial images
    const aspectRatio = img.width / img.height;
    if (aspectRatio > 5 || aspectRatio < 0.2) {
      warnings.push('Unusual aspect ratio detected. Please use a standard photo.');
    }

    URL.revokeObjectURL(img.src);
    resolve({ 
      valid: warnings.length === 0, 
      warnings,
      dimensions: { width: img.width, height: img.height },
      fileSize: file.size
    });
  };

  img.onerror = () => {
    warnings.push('Could not load image for quality check.');
    resolve({ valid: false, warnings });
  };

  img.src = URL.createObjectURL(file);
});

/**
 * Exponential backoff retry wrapper for API calls
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>} - Result from successful function call
 */
export const withRetry = async (fn, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 800ms, 1600ms, 2400ms
      const delayMs = 800 * attempt;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  throw lastError;
};

/**
 * Severity prediction based on category + severity level
 * Returns human-readable prediction of how the issue will worsen
 * @param {string} category - Issue category
 * @param {string} severity - Severity level
 * @returns {string|null} - Prediction text or null
 */
export const getSeverityPrediction = (category, severity) => {
  const predictions = {
    'Road & Infrastructure': {
      'Low': 'Minor issue - recommend monitoring weekly',
      'Medium': 'Will worsen significantly in ~14 days especially during monsoon',
      'High': 'Risk of vehicle damage and accidents within 3-5 days',
      'Critical': 'Immediate safety hazard — risk of serious accident'
    },
    'Water Supply': {
      'Low': 'Minor leakage - may increase water bills',
      'Medium': 'Risk of contamination if not fixed within 7 days',
      'High': 'Will affect 100+ households within 48 hours',
      'Critical': 'Immediate health hazard — escalated automatically'
    },
    'Electricity': {
      'Low': 'Minor electrical issue - schedule regular maintenance',
      'Medium': 'Risk of outage affecting multiple connections',
      'High': 'Risk of electrocution — requires urgent attention',
      'Critical': '⚡ Life-threatening hazard — auto-escalated to admin'
    },
    'Waste Management': {
      'Low': 'Minor accumulation - will be cleared in routine collection',
      'Medium': 'Health hazard risk increases daily',
      'High': 'Disease outbreak risk within 5-7 days',
      'Critical': 'Immediate health emergency — biohazard conditions'
    },
    'Public Safety': {
      'Low': 'Minor safety concern - recommend signage',
      'Medium': 'Risk of injury if not addressed within a week',
      'High': 'Danger to pedestrians and vehicles within 48 hours',
      'Critical': 'Immediate danger to life — requires emergency response'
    },
    'Sanitation': {
      'Low': 'Minor sanitation issue - routine cleaning needed',
      'Medium': 'Unsanitary conditions spreading - health risk in 5 days',
      'High': 'Significant health risk - possible disease vector',
      'Critical': 'Severe health hazard — epidemic risk'
    },
    'Public Property': {
      'Low': 'Minor damage - cosmetic repair needed',
      'Medium': 'Structural damage worsening - repair within 2 weeks',
      'High': 'Safety risk from damaged property - urgent repair needed',
      'Critical': 'Imminent collapse/failure risk — barricade area immediately'
    },
    'Other': {
      'Low': 'Minor issue - standard processing',
      'Medium': 'Moderate priority - address within a week',
      'High': 'High priority - address within 2-3 days',
      'Critical': 'Urgent attention required immediately'
    }
  };

  return predictions[category]?.[severity] || predictions['Other']?.[severity] || null;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted string like "2.5 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get category icon for display
 * @param {string} category - Category name
 * @returns {string} - Emoji icon
 */
export const getCategoryIcon = (category) => {
  const icons = {
    'Road & Infrastructure': '🛣️',
    'Water Supply': '💧',
    'Electricity': '⚡',
    'Waste Management': '🗑️',
    'Public Safety': '🚨',
    'Sanitation': '🧹',
    'Public Property': '🏛️',
    'Other': '📋'
  };
  return icons[category] || '📋';
};

/**
 * Get severity color classes for Tailwind
 * @param {string} severity - Severity level
 * @returns {Object} - Object with color class names
 */
export const getSeverityColors = (severity) => {
  const colors = {
    'Low': {
      bg: 'bg-green-500',
      bgLight: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      hex: '#22c55e'
    },
    'Medium': {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-300',
      hex: '#f59e0b'
    },
    'High': {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-300',
      hex: '#f97316'
    },
    'Critical': {
      bg: 'bg-red-500',
      bgLight: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      hex: '#ef4444',
      pulse: true
    }
  };
  return colors[severity] || colors['Medium'];
};

/**
 * Validate image file before processing
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const validTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
    'image/gif', 'image/bmp', 'image/heic', 'image/heif'
  ];
  
  // Check by extension as well (for screenshots that may have wrong MIME)
  const ext = file.name.split('.').pop().toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif'];
  
  if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
    return { valid: false, error: 'Please upload a valid image file (JPG, PNG, WEBP)' };
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB` };
  }

  return { valid: true, error: null };
};

export default {
  getMimeType,
  fileToBase64,
  parseGeminiJSON,
  checkImageQuality,
  withRetry,
  getSeverityPrediction,
  formatFileSize,
  getCategoryIcon,
  getSeverityColors,
  validateImageFile
};
