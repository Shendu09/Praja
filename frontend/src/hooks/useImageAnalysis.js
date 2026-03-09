/**
 * useImageAnalysis.js - Custom hook for Google Gemini Vision API image analysis
 * 
 * This hook handles:
 * - Converting images to Base64
 * - Sending images to Gemini Vision API for civic issue analysis
 * - Parsing and returning structured analysis results
 * 
 * Testing Instructions:
 * - Pothole photo → Road & Infrastructure, High/Critical
 * - Garbage dump photo → Waste Management, High
 * - Broken streetlight → Electricity, Medium
 * - Flooded road → Road & Infrastructure OR Water Supply, Critical
 * - Random selfie → isCivicIssue: false
 * - Blank/dark image → isCivicIssue: false
 */

import { useState, useCallback } from 'react';

// The exact prompt to send to Gemini for civic issue analysis
const ANALYSIS_PROMPT = `You are an AI assistant for a Citizen Grievance Management Portal in India.

Analyze this image carefully and return ONLY a valid JSON object with no extra text, no markdown, no code blocks.

Return exactly this structure:
{
  "isCivicIssue": true or false,
  "category": one of exactly ["Road & Infrastructure", "Water Supply", "Electricity", "Waste Management", "Public Safety", "Sanitation", "Public Property", "Other"],
  "severity": one of exactly ["Low", "Medium", "High", "Critical"],
  "title": "short title max 8 words describing the issue",
  "description": "one clear sentence describing what you see in the image",
  "department": "which government department should handle this",
  "suggestedAction": "one sentence on what action should be taken",
  "confidence": number between 0 and 100,
  "tags": ["tag1", "tag2", "tag3"] (3 relevant keywords)
}

Severity guide:
- Low: minor inconvenience, not urgent
- Medium: affects daily life, needs attention within a week
- High: significant issue, needs attention within 2-3 days
- Critical: safety hazard, needs immediate attention

If the image does NOT show a civic issue (e.g. selfie, random object, food), set isCivicIssue to false and category to "Other".

Return ONLY the JSON. No explanation. No markdown.`;

/**
 * Converts a File object to Base64 string (without the data URL prefix)
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
const toBase64 = (file) => new Promise((resolve, reject) => {
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
 * Gets the MIME type for the image
 * @param {File} file - The image file
 * @returns {string} - MIME type string
 */
const getMimeType = (file) => {
  const type = file.type;
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg'; // Default fallback
};

/**
 * Custom hook for analyzing images using Google Gemini Vision API
 * 
 * @param {string} apiKey - Google Gemini API key
 * @returns {Object} - { analyze, isAnalyzing, result, error, reset }
 * 
 * @example
 * const { analyze, isAnalyzing, result, error, reset } = useImageAnalysis(apiKey);
 * 
 * // Call analyze with a File object
 * const analysisResult = await analyze(file);
 */
export function useImageAnalysis(apiKey) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Analyzes an image file using Google Gemini Vision API
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object|null>} - Analysis result or null on error
   */
  const analyze = useCallback(async (imageFile) => {
    // Validate API key
    if (!apiKey) {
      const err = new Error('API key is required. Get one at https://aistudio.google.com/app/apikey');
      setError(err);
      return null;
    }

    // Validate file exists
    if (!imageFile) {
      const err = new Error('No image file provided');
      setError(err);
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Convert image to Base64
      const base64Data = await toBase64(imageFile);
      const mimeType = getMimeType(imageFile);

      // Step 2: Create the image preview URL for display
      const imagePreviewUrl = URL.createObjectURL(imageFile);

      // Step 3: Send to Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                },
                {
                  text: ANALYSIS_PROMPT
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          })
        }
      );

      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      // Step 4: Parse the response
      const data = await response.json();

      // Check if we got candidates
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from AI - no content returned');
      }

      const rawText = data.candidates[0].content.parts[0].text;

      // Step 5: Clean and parse JSON
      // Remove markdown code blocks if present
      let cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      // Try to extract JSON if there's extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      const analysisResult = JSON.parse(cleaned);

      // Validate required fields
      const requiredFields = ['isCivicIssue', 'category', 'severity', 'title', 'description'];
      for (const field of requiredFields) {
        if (analysisResult[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Create the final result object
      const finalResult = {
        ...analysisResult,
        imageBase64: base64Data,
        imagePreviewUrl,
        analyzedAt: new Date().toISOString()
      };

      setResult(finalResult);
      return finalResult;

    } catch (err) {
      console.error('Image analysis failed:', err);
      
      // Create a user-friendly error message
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (err.message.includes('API key')) {
        errorMessage = err.message;
      } else if (err.message.includes('JSON')) {
        errorMessage = 'Failed to parse AI response. Please try again.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message.includes('status 4')) {
        errorMessage = 'API error. Please check your API key.';
      } else if (err.message.includes('status 5')) {
        errorMessage = 'Server error. Please try again later.';
      }

      const error = new Error(errorMessage);
      error.originalError = err;
      setError(error);
      return null;

    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey]);

  /**
   * Resets the hook state to initial values
   */
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    error,
    reset
  };
}

export default useImageAnalysis;
