/**
 * ComplaintAIAnalyzer.jsx - AI-powered civic issue image analyzer
 * 
 * A self-contained React component that accepts an uploaded image from a citizen,
 * sends it to the Google Gemini Vision API for analysis, and returns structured
 * data to auto-fill a complaint submission form.
 * 
 * Features:
 * - Drag & drop image upload
 * - Image preview with "Analyze with AI" button
 * - Loading state with cycling messages
 * - Results display with severity color coding
 * - Error handling for various failure cases
 * - Not a civic issue detection
 * 
 * Testing Instructions:
 * - Pothole photo → Road & Infrastructure, High/Critical
 * - Garbage dump photo → Waste Management, High
 * - Broken streetlight → Electricity, Medium
 * - Flooded road → Road & Infrastructure OR Water Supply, Critical
 * - Random selfie → isCivicIssue: false
 * - Blank/dark image → isCivicIssue: false
 * 
 * @example
 * <ComplaintAIAnalyzer
 *   apiKey="YOUR_GEMINI_API_KEY"
 *   onAnalysisComplete={(result) => console.log(result)}
 *   onImageSelected={(file) => console.log('Selected:', file.name)}
 *   maxFileSizeMB={10}
 *   autoAnalyze={false}
 * />
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageAnalysis } from '../hooks/useImageAnalysis';

// Loading messages that cycle during analysis
const LOADING_MESSAGES = [
  'Detecting issue type...',
  'Assessing severity...',
  'Identifying department...',
  'Generating description...'
];

// Severity color configurations
const SEVERITY_COLORS = {
  Low: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  Medium: {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  High: {
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  Critical: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    pulse: true
  }
};

// Accepted file types
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

/**
 * ComplaintAIAnalyzer Component
 * 
 * @param {Object} props
 * @param {string} [props.apiKey] - Optional: Google Gemini API key (uses env var if not provided)
 * @param {Function} props.onAnalysisComplete - Required: Callback when analysis completes
 * @param {Function} [props.onImageSelected] - Optional: Callback when image is selected
 * @param {number} [props.maxFileSizeMB=10] - Optional: Max file size in MB
 * @param {boolean} [props.autoAnalyze=false] - Optional: Auto-analyze on upload
 */
export default function ComplaintAIAnalyzer({
  apiKey: propApiKey,
  onAnalysisComplete,
  onImageSelected,
  maxFileSizeMB = 10,
  autoAnalyze = false
}) {
  // Use provided API key or fall back to environment variable
  const apiKey = propApiKey || import.meta.env.VITE_GEMINI_API_KEY;
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [validationError, setValidationError] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Custom hook for image analysis
  const { analyze, isAnalyzing, result, error, reset } = useImageAnalysis(apiKey);

  // Cycle through loading messages
  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Validate file
  const validateFile = useCallback((file) => {
    if (!file) {
      return 'No file selected';
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload JPG, PNG or WEBP only';
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      return `File too large. Max ${maxFileSizeMB}MB`;
    }

    return null;
  }, [maxFileSizeMB]);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    // Reset previous state
    reset();
    setValidationError(null);

    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Call optional callback
    if (onImageSelected) {
      onImageSelected(file);
    }

    // Auto-analyze if enabled
    if (autoAnalyze) {
      analyze(file);
    }
  }, [validateFile, onImageSelected, autoAnalyze, analyze, reset]);

  // Handle input change
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const analysisResult = await analyze(selectedFile);
    
    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };

  // Handle re-analyze
  const handleReAnalyze = () => {
    if (selectedFile) {
      analyze(selectedFile);
    }
  };

  // Handle change photo
  const handleChangePhoto = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    fileInputRef.current?.click();
  };

  // Handle try another photo
  const handleTryAnother = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
  };

  // Handle use these details
  const handleUseDetails = () => {
    if (result && onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Render confidence bar
  const renderConfidenceBar = (confidence) => {
    const color = confidence > 70 ? 'bg-green-500' : confidence > 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    );
  };

  // Render severity badge
  const renderSeverityBadge = (severity) => {
    const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Medium;
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-bold text-white ${colors.bg} ${
          colors.pulse ? 'animate-pulse' : ''
        }`}
      >
        {severity}
      </span>
    );
  };

  // ========== RENDER STATES ==========

  // State 0: No API key
  if (!apiKey) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-red-500/30 bg-[#0D1117] p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-bold text-lg mb-2">API Key Required</h3>
          <p className="text-white/60 text-sm mb-4">
            To use AI image analysis, you need a Google Gemini API key.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Get Free API Key →
          </a>
          <p className="text-white/40 text-xs mt-3">
            Free tier: 1500 requests/day, no credit card needed
          </p>
        </div>
      </div>
    );
  }

  // State 6: Error
  if (error && !result) {
    return (
      <div className="rounded-2xl bg-[#0D1117] overflow-hidden">
        {/* Keep image preview if available */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover opacity-50"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h3 className="text-red-400 font-bold text-lg mb-2">Analysis Failed</h3>
            <p className="text-white/60 text-sm mb-4">
              {error.message || 'Please check your connection and try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReAnalyze}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🔄 Retry
              </button>
              <button
                onClick={handleTryAnother}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Try Another Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 5: Not a civic issue
  if (result && !result.isCivicIssue) {
    return (
      <div className="rounded-2xl bg-[#0D1117] overflow-hidden">
        {/* Image preview */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover opacity-60"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-yellow-400 font-bold text-lg mb-2">No Civic Issue Detected</h3>
            <p className="text-white/60 text-sm mb-4">
              The uploaded image doesn't appear to show a civic problem.
              <br />
              Please upload a photo of the actual issue (road damage, garbage, water leak, etc.)
            </p>
            <button
              onClick={handleTryAnother}
              className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              📷 Try Another Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Results displayed
  if (result && result.isCivicIssue) {
    const severityColors = SEVERITY_COLORS[result.severity] || SEVERITY_COLORS.Medium;
    
    return (
      <div className="rounded-2xl bg-[#0D1117] overflow-hidden border border-white/10">
        {/* Image preview */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Analyzed issue"
              className="w-full h-48 object-cover"
            />
            {/* Severity overlay badge */}
            <div className="absolute top-3 right-3">
              {renderSeverityBadge(result.severity)}
            </div>
          </div>
        )}
        
        {/* Results card */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-lg">✅</span>
              <span className="text-white font-bold">AI Analysis Complete</span>
            </div>
            <span className="text-white/60 text-sm">
              {result.confidence}% confident
            </span>
          </div>
          {renderConfidenceBar(result.confidence)}
          
          {/* Results grid */}
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">📂</span>
              <div className="flex-1">
                <span className="text-white/50">Category</span>
                <p className="text-white font-medium">{result.category}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">🔴</span>
              <div className="flex-1">
                <span className="text-white/50">Severity</span>
                <div className="mt-1">{renderSeverityBadge(result.severity)}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">📋</span>
              <div className="flex-1">
                <span className="text-white/50">Title</span>
                <p className="text-white font-medium">{result.title}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">📝</span>
              <div className="flex-1">
                <span className="text-white/50">Description</span>
                <p className="text-white">{result.description}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">🏛️</span>
              <div className="flex-1">
                <span className="text-white/50">Department</span>
                <p className="text-white">{result.department}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-white/40 w-5">🔧</span>
              <div className="flex-1">
                <span className="text-white/50">Suggested Action</span>
                <p className="text-white">{result.suggestedAction}</p>
              </div>
            </div>
            
            {result.tags && result.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-white/40 w-5">🏷️</span>
                <div className="flex-1">
                  <span className="text-white/50">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {result.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 mt-5 pt-4 border-t border-white/10">
            <button
              onClick={handleUseDetails}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <span>✓</span>
              Use These Details
            </button>
            <button
              onClick={handleReAnalyze}
              className="px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              🔄 Re-analyze
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Analyzing (loading)
  if (isAnalyzing) {
    return (
      <div className="rounded-2xl bg-[#0D1117] overflow-hidden border border-white/10">
        {/* Image preview with overlay */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Analyzing..."
              className="w-full h-48 object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              {/* Animated dots */}
              <div className="flex gap-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-green-400"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
              <p className="text-white font-medium">AI is analyzing your image...</p>
            </div>
          </div>
        )}
        
        {/* Loading message */}
        <div className="p-6 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/60"
            >
              {LOADING_MESSAGES[loadingMessageIndex]}
            </motion.p>
          </AnimatePresence>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === loadingMessageIndex ? 'bg-green-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // State 2: Image selected (not yet analyzed)
  if (selectedFile && previewUrl) {
    return (
      <div className="rounded-2xl bg-[#0D1117] overflow-hidden border border-white/10">
        {/* Image preview */}
        <div className="relative">
          <img
            src={previewUrl}
            alt="Selected photo"
            className="w-full h-56 object-cover"
          />
          {/* File info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm truncate">{selectedFile.name}</p>
            <p className="text-white/60 text-xs">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-5">
          {/* Analyze button */}
          <motion.button
            onClick={handleAnalyze}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-[#0D4F44] to-[#1a7a6e] text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/30 hover:shadow-xl hover:shadow-green-900/40 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🤖</span>
            Analyze with AI
          </motion.button>
          
          {/* Change photo link */}
          <button
            onClick={handleChangePhoto}
            className="w-full mt-3 py-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            Change photo
          </button>
        </div>
      </div>
    );
  }

  // State 1: Idle (no image) - Upload zone
  return (
    <div
      ref={dropZoneRef}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'border-[#4ade80] bg-[#4ade80]/10'
          : validationError
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-white/10 bg-[#0D1117] hover:border-white/30 hover:bg-white/5'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div className="p-10 text-center">
        {/* Upload icon */}
        <motion.div
          className="text-5xl mb-4"
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {validationError ? '⚠️' : isDragging ? '📥' : '📷'}
        </motion.div>
        
        {/* Text */}
        {validationError ? (
          <>
            <p className="text-red-400 font-medium mb-2">{validationError}</p>
            <p className="text-white/40 text-sm">Click to try again</p>
          </>
        ) : (
          <>
            <p className="text-white font-medium mb-2">
              {isDragging ? 'Drop your image here' : 'Upload a photo of the civic issue'}
            </p>
            <p className="text-white/40 text-sm mb-1">
              Drag & drop or click to upload
            </p>
            <p className="text-white/30 text-xs">
              JPG, PNG, WEBP up to {maxFileSizeMB}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
