/**
 * useImageAnalysis.js - Advanced AI Image Analysis Hook for PRAJA Grievance Portal
 * 
 * Complete rewrite with two-stage analysis:
 * - Stage 1: Quick validation (is this a civic issue?)
 * - Stage 2: Deep analysis (category, severity, impact, recommendations)
 * 
 * Features:
 * - Fixed MIME type detection for screenshots/PNG files
 * - Two-stage Gemini API analysis
 * - Exponential backoff retry logic
 * - Progress tracking with status messages
 * - Location intelligence from images
 * - AI recommendations for officials
 */

import { useState, useCallback } from 'react';
import {
  getMimeType,
  fileToBase64,
  parseGeminiJSON,
  checkImageQuality,
  withRetry,
  getSeverityPrediction
} from '../utils/aiHelpers';

// Gemini API endpoint
const getGeminiUrl = () => 
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

// STAGE 1 PROMPT — Quick validation check
const STAGE1_PROMPT = `
Look at this image carefully.
Return ONLY this exact JSON with no markdown no extra text:
{
  "isCivicIssue": true or false,
  "imageQuality": "clear" or "blurry" or "dark" or "screenshot" or "good",
  "mainSubject": "one sentence describing the main subject of this image",
  "reason": "why you think this is or is not a civic issue in India - be specific"
}

A civic issue is any public infrastructure problem, sanitation issue, safety hazard, or municipal service failure that affects citizens in India.
Examples of civic issues: potholes, garbage dumps, broken streetlights, flooded roads, damaged footpaths, overflowing drains, stray animals, illegal dumping, broken water pipes, fallen trees, damaged public property, unclean public toilets.
Examples of NON-civic issues: selfies, food photos, indoor rooms, personal belongings, landscapes without visible problems, pets at home.
`;

// STAGE 2 PROMPT — Deep analysis
const STAGE2_PROMPT = `
You are an expert civic infrastructure analyst for Indian municipalities.
This image shows a civic issue in India. Perform a thorough professional analysis.

Return ONLY this exact JSON structure with no markdown and no extra text:
{
  "category": one of exactly [
    "Road & Infrastructure",
    "Water Supply",
    "Electricity", 
    "Waste Management",
    "Public Safety",
    "Sanitation",
    "Public Property",
    "Other"
  ],
  
  "severity": one of exactly ["Low", "Medium", "High", "Critical"],
  
  "title": "concise 6-8 word title describing the specific issue",
  
  "description": "2-3 professional sentences describing exactly what you see. Be specific about damage extent, size, and visible conditions.",
  
  "visualEvidence": [
    "specific visible detail 1 that confirms this issue",
    "specific visible detail 2",
    "specific visible detail 3"
  ],
  
  "estimatedImpact": {
    "peopleAffected": "estimated number of people affected e.g. 50-100 residents",
    "urgencyDays": 3,
    "safetyRisk": true or false,
    "trafficImpact": true or false
  },
  
  "locationClues": {
    "locationType": one of ["residential_street", "main_road", "highway", "marketplace", "park", "govt_building", "industrial_area", "unknown"],
    "timeOfDay": one of ["day", "night", "unclear"],
    "weatherCondition": one of ["dry", "wet", "flooded", "unclear"],
    "nearbyLandmarks": ["any shop names signs or landmarks visible in the image - return empty array if none"],
    "urbanRural": one of ["urban", "semi-urban", "rural", "unclear"],
    "roadType": one of ["main_road", "lane", "highway", "footpath", "unknown"]
  },
  
  "aiRecommendations": {
    "department": "exact government department name that should handle this",
    "immediateAction": "what must be done in the next 24 hours",
    "permanentFix": "recommended long-term solution",
    "estimatedRepairTime": "e.g. 2-3 days",
    "estimatedCostINR": "rough cost range in INR e.g. 15000-40000",
    "requiredResources": ["resource 1", "resource 2", "resource 3"],
    "suggestedATR": "pre-written Action Taken Report sentence an official can use directly"
  },
  
  "relatedIssues": [
    "secondary issue that likely exists based on this image"
  ],
  
  "confidence": number between 60 and 100,
  
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Severity guide:
Low = cosmetic issue, no safety risk, can wait
Medium = inconvenience to citizens, needs fix within a week  
High = significant disruption or safety concern, fix within 2-3 days
Critical = immediate safety hazard, life-threatening, fix today

Department guide for India:
- Roads, potholes, footpaths → Public Works Department / PWD
- Water supply, pipe leaks → Water Supply Board / Municipal Water Works
- Electricity, streetlights → DISCOMS / Electricity Department
- Garbage, waste → Municipal Sanitation / Solid Waste Management
- Drains, sewerage → Drainage Department / Underground Drainage
- Trees, parks → Horticulture Department / Parks Division
- Traffic safety → Traffic Police / Municipal Traffic Cell
- Public buildings → Estate Department / Municipal Engineering

Think like a senior municipal engineer reviewing this for official records. Be accurate and professional.
`;

/**
 * Advanced Image Analysis Hook with Two-Stage Analysis
 * 
 * @returns {Object} Hook state and methods
 * 
 * States: idle | checking-quality | stage1 | stage2 | complete | not-civic | error
 * 
 * @example
 * const { analyze, status, result, error, progress, statusMessage, reset } = useImageAnalysis();
 * await analyze(file);
 */
export function useImageAnalysis() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  /**
   * Analyzes an image file using two-stage Gemini Vision API
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object|null>} - Analysis result or null on error
   */
  const analyze = useCallback(async (imageFile) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Validate API key
    if (!apiKey) {
      setStatus('error');
      setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
      return null;
    }

    // Validate file exists
    if (!imageFile) {
      setStatus('error');
      setError('No image file provided');
      return null;
    }

    try {
      // STEP 1: Check image quality
      setStatus('checking-quality');
      setProgress(10);
      setStatusMessage('Checking image quality...');

      const quality = await checkImageQuality(imageFile);
      if (!quality.valid) {
        console.warn('Image quality warnings:', quality.warnings);
        // Don't block — just warn and continue
      }

      // STEP 2: Convert to base64
      setProgress(20);
      setStatusMessage('Preparing image...');
      
      const base64 = await fileToBase64(imageFile);
      const mimeType = getMimeType(imageFile);
      const imagePreviewUrl = URL.createObjectURL(imageFile);

      // STEP 3: Stage 1 — Validate it's a civic issue
      setStatus('stage1');
      setProgress(30);
      setStatusMessage('Detecting issue type...');

      const stage1Result = await withRetry(async () => {
        const res = await fetch(getGeminiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: STAGE1_PROMPT }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('No response from AI');
        }
        
        return parseGeminiJSON(data.candidates[0].content.parts[0].text);
      });

      // Check if it's a civic issue
      if (!stage1Result.isCivicIssue) {
        setStatus('not-civic');
        setProgress(100);
        setResult({
          isCivicIssue: false,
          imageQuality: stage1Result.imageQuality,
          mainSubject: stage1Result.mainSubject,
          reason: stage1Result.reason,
          imagePreviewUrl
        });
        return { isCivicIssue: false, ...stage1Result, imagePreviewUrl };
      }

      // STEP 4: Stage 2 — Deep analysis
      setStatus('stage2');
      setProgress(50);
      setStatusMessage('Analyzing severity and impact...');

      const stage2Result = await withRetry(async () => {
        const res = await fetch(getGeminiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: STAGE2_PROMPT }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('No response from AI');
        }
        
        return parseGeminiJSON(data.candidates[0].content.parts[0].text);
      });

      // STEP 5: Build final result
      setProgress(90);
      setStatusMessage('Building recommendations...');

      // Add severity prediction
      const prediction = getSeverityPrediction(
        stage2Result.category,
        stage2Result.severity
      );

      // Final result object
      const finalResult = {
        isCivicIssue: true,
        imageQuality: stage1Result.imageQuality,
        severityPrediction: prediction,
        ...stage2Result,
        imageBase64: base64,
        imagePreviewUrl,
        analyzedAt: new Date().toISOString()
      };

      setProgress(100);
      setStatus('complete');
      setStatusMessage('Analysis complete!');
      setResult(finalResult);
      
      return finalResult;

    } catch (err) {
      console.error('Image analysis failed:', err);
      
      // Create user-friendly error message
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (err.message.includes('API key') || err.message.includes('API_KEY')) {
        errorMessage = 'Invalid API key. Please check your Gemini API configuration.';
      } else if (err.message.includes('JSON') || err.message.includes('parse')) {
        errorMessage = 'Failed to parse AI response. Please try again.';
      } else if (err.message.includes('network') || err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('429') || err.message.includes('quota')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
      } else if (err.message.includes('400')) {
        errorMessage = 'Invalid request. The image may be too large or in an unsupported format.';
      } else if (err.message.includes('500') || err.message.includes('503')) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      } else {
        errorMessage = err.message || 'Analysis failed. Please try again.';
      }

      setStatus('error');
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Resets the hook state to initial values
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusMessage('');
  }, []);

  // For backward compatibility
  const isAnalyzing = status === 'checking-quality' || status === 'stage1' || status === 'stage2';

  return {
    analyze,
    status,
    result,
    error,
    progress,
    statusMessage,
    reset,
    // Backward compatibility
    isAnalyzing
  };
}

// Named export for backward compatibility
export const useAdvancedImageAnalysis = useImageAnalysis;

export default useImageAnalysis;
