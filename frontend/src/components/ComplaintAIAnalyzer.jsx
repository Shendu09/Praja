/**
 * ComplaintAIAnalyzer.jsx - Advanced AI-powered civic issue image analyzer
 * 
 * A comprehensive React component that uses two-stage Gemini AI analysis
 * to detect, categorize, and assess civic issues from uploaded images.
 * 
 * Features:
 * - Two-stage AI analysis (validation + deep analysis)
 * - Visual evidence detection
 * - Impact assessment
 * - Location intelligence from images
 * - AI recommendations for officials
 * - Severity prediction
 * - Progress tracking with status messages
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Image as ImageIcon, Eye, Users, Clock, 
  Shield, MapPin, Wrench, Building, Tag, ChevronDown, ChevronUp,
  Zap, AlertCircle, FileWarning, Loader
} from 'lucide-react';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import { getSeverityColors, getCategoryIcon, formatFileSize, validateImageFile } from '../utils/aiHelpers';

// Loading messages that cycle during analysis
const LOADING_MESSAGES = [
  { stage: 'checking-quality', messages: ['Checking image quality...', 'Validating image format...'] },
  { stage: 'stage1', messages: ['Detecting issue type...', 'Analyzing image content...', 'Identifying civic problems...'] },
  { stage: 'stage2', messages: ['Assessing severity...', 'Estimating impact...', 'Identifying affected area...', 'Generating recommendations...', 'Building official report...'] }
];

// Accepted file types
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic';

/**
 * ComplaintAIAnalyzer Component
 */
export default function ComplaintAIAnalyzer({
  onAnalysisComplete,
  onImageSelected,
  maxFileSizeMB = 10,
  autoAnalyze = false
}) {
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    evidence: true,
    impact: true,
    location: false,
    recommendations: true
  });

  // Refs
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Advanced image analysis hook
  const { 
    analyze, 
    status, 
    result, 
    error, 
    progress, 
    statusMessage, 
    reset 
  } = useImageAnalysis();

  // Cycle through loading messages based on status
  useEffect(() => {
    if (status === 'idle' || status === 'complete' || status === 'error' || status === 'not-civic') return;

    const stageMessages = LOADING_MESSAGES.find(m => m.stage === status)?.messages || ['Analyzing...'];
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % stageMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [status]);

  // Get current loading message
  const getCurrentMessage = () => {
    if (statusMessage) return statusMessage;
    const stageMessages = LOADING_MESSAGES.find(m => m.stage === status)?.messages || ['Analyzing...'];
    return stageMessages[loadingMessageIndex % stageMessages.length];
  };

  // Validate file
  const validateFile = useCallback((file) => {
    const validation = validateImageFile(file, maxFileSizeMB);
    return validation.error;
  }, [maxFileSizeMB]);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    reset();
    setValidationError(null);
    setLoadingMessageIndex(0);

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (onImageSelected) {
      onImageSelected(file, url);
    }

    if (autoAnalyze) {
      analyze(file);
    }
  }, [validateFile, onImageSelected, autoAnalyze, analyze, reset]);

  // Handle input change
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
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
    if (file) handleFileSelect(file);
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await analyze(selectedFile);
  };

  // Handle re-analyze
  const handleReAnalyze = () => {
    if (selectedFile) {
      reset();
      setLoadingMessageIndex(0);
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

  // Handle use AI details
  const handleUseDetails = () => {
    if (result && onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Render confidence bar
  const renderConfidenceBar = (confidence) => {
    const color = confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    );
  };

  // Render severity badge
  const renderSeverityBadge = (severity) => {
    const colors = getSeverityColors(severity);
    return (
      <span
        className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${colors.bg} ${
          colors.pulse ? 'animate-pulse' : ''
        } shadow-lg`}
      >
        {severity?.toUpperCase()}
      </span>
    );
  };

  // Render progress stages
  const renderProgressStages = () => {
    const stages = [
      { id: 'checking-quality', label: 'Validating image', icon: ImageIcon },
      { id: 'stage1', label: 'Detecting issue type', icon: Eye },
      { id: 'stage2', label: 'Deep analysis', icon: Zap },
      { id: 'complete', label: 'Complete', icon: CheckCircle }
    ];

    const currentIndex = stages.findIndex(s => s.id === status);

    return (
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === status;
          const isComplete = index < currentIndex;
          
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isComplete ? 'bg-green-500 text-white' :
                isActive ? 'bg-teal text-white animate-pulse' :
                'bg-gray-200 text-gray-400'
              }`}>
                {isComplete ? <CheckCircle size={14} /> : <Icon size={14} />}
              </div>
              <span className={`text-sm ${isActive ? 'text-teal font-medium' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== RENDER STATES ==========

  // State: Error
  if (status === 'error') {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        {previewUrl && (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover opacity-50" />
          </div>
        )}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <XCircle size={48} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-red-700 font-bold text-lg mb-2">Analysis Failed</h3>
            <p className="text-red-600 text-sm mb-4">{error || 'Please check your connection and try again.'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReAnalyze}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button
                onClick={handleTryAnother}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Try Another Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Not a civic issue
  if (status === 'not-civic' && result) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        {previewUrl && (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover opacity-60" />
          </div>
        )}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3" />
            <h3 className="text-amber-700 font-bold text-lg mb-2">No Civic Issue Detected</h3>
            <p className="text-amber-600 text-sm mb-2">
              {result.mainSubject || 'The uploaded image doesn\'t appear to show a civic problem.'}
            </p>
            {result.reason && (
              <p className="text-amber-500 text-xs mb-4 italic">"{result.reason}"</p>
            )}
            <p className="text-gray-500 text-xs mb-4">
              Please upload a photo of an actual issue like road damage, garbage dumps, broken streetlights, etc.
            </p>
            <button
              onClick={handleTryAnother}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <Camera size={16} /> Try Another Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Complete with results
  if (status === 'complete' && result && result.isCivicIssue) {
    const colors = getSeverityColors(result.severity);
    
    return (
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        {/* Image with severity overlay */}
        {previewUrl && (
          <div className="relative">
            <img src={previewUrl} alt="Analyzed issue" className="w-full h-48 object-cover" />
            <div className="absolute top-3 right-3">
              {renderSeverityBadge(result.severity)}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white text-sm font-medium">{getCategoryIcon(result.category)} {result.category}</span>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Header with confidence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <span className="font-bold text-gray-800">AI Analysis Complete</span>
            </div>
            <span className="text-sm text-gray-500">{result.confidence}% confident</span>
          </div>
          {renderConfidenceBar(result.confidence)}

          {/* Title and Description */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-800 text-lg mb-2">{result.title}</h3>
            <p className="text-gray-600 text-sm">{result.description}</p>
          </div>

          {/* Severity Prediction */}
          {result.severityPrediction && (
            <div className={`${colors.bgLight} border ${colors.border} rounded-xl p-3`}>
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className={colors.text} />
                <div>
                  <span className={`text-sm font-medium ${colors.text}`}>AI Severity Prediction</span>
                  <p className={`text-sm ${colors.text} opacity-80`}>{result.severityPrediction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Visual Evidence Section */}
          {result.visualEvidence?.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('evidence')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <Eye size={18} /> What AI Saw
                </span>
                {expandedSections.evidence ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedSections.evidence && (
                <div className="p-3 space-y-2">
                  {result.visualEvidence.map((evidence, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-teal">•</span>
                      <span>{evidence}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Impact Assessment Section */}
          {result.estimatedImpact && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('impact')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <Users size={18} /> Impact Assessment
                </span>
                {expandedSections.impact ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedSections.impact && (
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-gray-600">~{result.estimatedImpact.peopleAffected}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-600">Critical in {result.estimatedImpact.urgencyDays} days</span>
                  </div>
                  {result.estimatedImpact.safetyRisk && (
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="text-red-600 font-medium">Safety Risk Detected</span>
                    </div>
                  )}
                  {result.estimatedImpact.trafficImpact && (
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <Zap size={16} className="text-orange-500" />
                      <span className="text-orange-600">Traffic Impact: Yes</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Location Intelligence Section */}
          {result.locationClues && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <MapPin size={18} /> Location Intelligence
                </span>
                {expandedSections.location ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedSections.location && (
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {result.locationClues.locationType && result.locationClues.locationType !== 'unknown' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        📍 {result.locationClues.locationType.replace(/_/g, ' ')}
                      </span>
                    )}
                    {result.locationClues.urbanRural && result.locationClues.urbanRural !== 'unclear' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        🏙️ {result.locationClues.urbanRural}
                      </span>
                    )}
                    {result.locationClues.weatherCondition && result.locationClues.weatherCondition !== 'unclear' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {result.locationClues.weatherCondition === 'wet' ? '🌧️' : '☀️'} {result.locationClues.weatherCondition}
                      </span>
                    )}
                    {result.locationClues.timeOfDay && result.locationClues.timeOfDay !== 'unclear' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        🕐 {result.locationClues.timeOfDay}
                      </span>
                    )}
                  </div>
                  {result.locationClues.nearbyLandmarks?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">🏪 Landmarks: </span>
                      {result.locationClues.nearbyLandmarks.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations Section */}
          {result.aiRecommendations && (
            <div className="border border-teal/30 rounded-xl overflow-hidden bg-teal/5">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex items-center justify-between p-3 bg-teal/10 hover:bg-teal/20 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-teal">
                  <Wrench size={18} /> AI Recommendations
                </span>
                {expandedSections.recommendations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedSections.recommendations && (
                <div className="p-3 space-y-3">
                  {/* Department */}
                  <div className="flex items-start gap-2">
                    <Building size={16} className="text-teal mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500">Recommended Department</span>
                      <p className="text-sm font-medium text-gray-800">{result.aiRecommendations.department}</p>
                    </div>
                  </div>
                  
                  {/* Immediate Action */}
                  <div className="flex items-start gap-2">
                    <Zap size={16} className="text-orange-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500">Immediate Action (24hrs)</span>
                      <p className="text-sm text-gray-700">{result.aiRecommendations.immediateAction}</p>
                    </div>
                  </div>
                  
                  {/* Permanent Fix */}
                  <div className="flex items-start gap-2">
                    <Wrench size={16} className="text-gray-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500">Long-term Solution</span>
                      <p className="text-sm text-gray-700">{result.aiRecommendations.permanentFix}</p>
                    </div>
                  </div>
                  
                  {/* Estimates Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <span className="text-xs text-gray-500 block">Est. Time</span>
                      <span className="text-sm font-medium text-gray-800">{result.aiRecommendations.estimatedRepairTime}</span>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <span className="text-xs text-gray-500 block">Est. Cost</span>
                      <span className="text-sm font-medium text-gray-800">₹{result.aiRecommendations.estimatedCostINR}</span>
                    </div>
                  </div>

                  {/* Required Resources */}
                  {result.aiRecommendations.requiredResources?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-gray-500 block mb-1">Required Resources</span>
                      <div className="flex flex-wrap gap-1">
                        {result.aiRecommendations.requiredResources.map((resource, i) => (
                          <span key={i} className="px-2 py-1 bg-white text-gray-600 rounded text-xs">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {result.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Tag size={14} className="text-gray-400" />
              {result.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleUseDetails}
              className="flex-1 py-3 bg-gradient-to-r from-teal to-emerald-500 text-white rounded-xl font-medium hover:from-teal/90 hover:to-emerald-500/90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle size={18} />
              Use All AI Details
            </button>
            <button
              onClick={handleChangePhoto}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Analyzing (loading)
  if (status !== 'idle' && status !== 'complete' && status !== 'error' && status !== 'not-civic') {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        {previewUrl && (
          <div className="relative">
            <img src={previewUrl} alt="Analyzing..." className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <Loader size={40} className="text-white animate-spin mx-auto mb-2" />
                <p className="text-white font-medium">AI is analyzing...</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Analysis Progress</span>
              <span className="text-teal font-medium">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stage indicators */}
          {renderProgressStages()}

          {/* Current message */}
          <div className="mt-4 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={getCurrentMessage()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-gray-500 text-sm"
              >
                {getCurrentMessage()}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // State: Image selected (not yet analyzed)
  if (selectedFile && previewUrl && status === 'idle') {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="relative">
          <img src={previewUrl} alt="Selected photo" className="w-full h-56 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm truncate">{selectedFile.name}</p>
            <p className="text-white/60 text-xs">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
        
        <div className="p-5">
          <motion.button
            onClick={handleAnalyze}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-teal to-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🤖</span>
            Analyze with AI
          </motion.button>
          
          <button
            onClick={handleChangePhoto}
            className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Choose different photo
          </button>
        </div>
      </div>
    );
  }

  // State: Idle (no image) - Upload zone
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
          ? 'border-teal bg-teal/10'
          : validationError
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 bg-gray-50 hover:border-teal hover:bg-teal/5'
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
        <motion.div
          className="text-5xl mb-4"
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {validationError ? '⚠️' : isDragging ? '📥' : '📷'}
        </motion.div>
        
        {validationError ? (
          <>
            <p className="text-red-500 font-medium mb-2">{validationError}</p>
            <p className="text-gray-400 text-sm">Click to try again</p>
          </>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-2">
              {isDragging ? 'Drop your image here' : 'Upload Photo of the Issue'}
            </p>
            <p className="text-gray-400 text-sm mb-1">
              JPG, PNG, WEBP, Screenshots — up to {maxFileSizeMB}MB
            </p>
            <p className="text-gray-300 text-xs">
              Drag & drop or click to browse
            </p>
          </>
        )}
      </div>
    </div>
  );
}
