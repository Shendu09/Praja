/**
 * useImageAnalysis.js - Calls the local Python CLIP-based analyzer service.
 * Start the Python service before using: Praja/analyze_service/start.bat
 */

import { useState, useCallback } from 'react';

const ANALYZE_URL = import.meta.env.VITE_ANALYZE_URL || 'http://localhost:8000';

export function useImageAnalysis() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const analyze = useCallback(async (imageFile) => {
    if (!imageFile) {
      setStatus('error');
      setError('No image file provided');
      return null;
    }

    try {
      setStatus('stage1');
      setProgress(20);
      setStatusMessage('Uploading image to AI...');

      const formData = new FormData();
      formData.append('file', imageFile);

      setProgress(45);
      setStatusMessage('Detecting civic issue type...');

      const res = await fetch(`${ANALYZE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      setProgress(80);
      setStatusMessage('Building analysis report...');

      const data = await res.json();
      const imagePreviewUrl = URL.createObjectURL(imageFile);

      if (!data.isCivicIssue) {
        const notCivicResult = { ...data, imagePreviewUrl };
        setStatus('not-civic');
        setProgress(100);
        setResult(notCivicResult);
        return notCivicResult;
      }

      const finalResult = {
        ...data,
        imagePreviewUrl,
        analyzedAt: new Date().toISOString(),
      };

      setProgress(100);
      setStatus('complete');
      setStatusMessage('Analysis complete!');
      setResult(finalResult);
      return finalResult;

    } catch (err) {
      console.error('Image analysis failed:', err);
      let errorMessage = err.message || 'Analysis failed. Please try again.';

      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('ECONNREFUSED')
      ) {
        errorMessage =
          'Cannot connect to the AI service. Please run: Praja/analyze_service/start.bat';
      }

      setStatus('error');
      setError(errorMessage);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusMessage('');
  }, []);

  const isAnalyzing = status === 'stage1' || status === 'stage2';

  return {
    analyze,
    status,
    result,
    error,
    progress,
    statusMessage,
    reset,
    isAnalyzing,
  };
}

export const useAdvancedImageAnalysis = useImageAnalysis;
export default useImageAnalysis;
