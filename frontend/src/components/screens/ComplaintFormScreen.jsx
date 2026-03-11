import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Info, Check, Crosshair, Loader, Shield, AlertTriangle, Building, Sparkles, XCircle, Eye, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import TealHeader from '../TealHeader';
import { useUIStore, useComplaintsStore, useAuthStore } from '../../store';
import { getLocationWithAddress } from '../../services/location';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';
import LocationMap from '../LocationMap';
import api from '../../services/api';

export default function ComplaintFormScreen() {
  const { selectedCategory, setScreen, setActiveTab } = useUIStore();
  const { createComplaint, isLoading } = useComplaintsStore();
  const { updateUser, user } = useAuthStore();
  
  // Advanced AI Image Analysis Hook (no longer needs API key parameter)
  const { 
    analyze: analyzeImage, 
    isAnalyzing, 
    result: geminiResult, 
    error: geminiError, 
    reset: resetAnalysis,
    status: analysisStatus,
    progress: analysisProgress,
    statusMessage 
  } = useImageAnalysis();
  
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState({
    address: 'Detecting your location...',
    coordinates: [0, 0],
    city: '',
    state: '',
    pincode: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiVisionResult, setAiVisionResult] = useState(null);
  const [duplicateComplaints, setDuplicateComplaints] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const fileRef = useRef();

  // Check for duplicates when location and AI result are available
  useEffect(() => {
    const checkDuplicates = async () => {
      if (aiVisionResult?.isCivicIssue && location.coordinates[0] !== 0) {
        try {
          const response = await api.post('/complaints/check-duplicate', {
            aiCategory: aiVisionResult.category,
            latitude: location.coordinates[1], // lat is second in [lng, lat]
            longitude: location.coordinates[0]
          });
          if (response.data?.hasDuplicate) {
            setDuplicateComplaints(response.data.complaints);
            setShowDuplicateWarning(true);
          }
        } catch (error) {
          console.warn('Duplicate check failed:', error);
        }
      }
    };
    checkDuplicates();
  }, [aiVisionResult, location.coordinates]);

  // Get real location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLocating(true);
        setLocationError(null);
        
        const locationData = await getLocationWithAddress();
        
        setLocation({
          coordinates: locationData.coordinates,
          address: locationData.formatted || locationData.full,
          city: locationData.city,
          state: locationData.state,
          pincode: locationData.pincode,
          area: locationData.area,
          plusCode: locationData.plusCode,
        });
        
        toast.success('Location detected!', { icon: '📍' });
      } catch (error) {
        console.error('Location error:', error);
        setLocationError(error.message);
        toast.error(error.message || 'Could not detect location');
        
        setLocation({
          coordinates: [78.4867, 17.385],
          address: 'Please enable location access',
          city: '',
          state: '',
          pincode: '',
        });
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocation();
  }, []);

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const locationData = await getLocationWithAddress();
      setLocation({
        coordinates: locationData.coordinates,
        address: locationData.formatted || locationData.full,
        city: locationData.city,
        state: locationData.state,
        pincode: locationData.pincode,
      });
      toast.success('Location updated!', { icon: '📍' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleBack = () => {
    setScreen('category');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      // Store file reference for AI analysis
      setPhotoFile(file);
      setAiVisionResult(null);
      resetAnalysis();
      
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target.result);
      reader.readAsDataURL(file);
      
      // Auto-analyze with Gemini Vision if API key is available
      if (geminiApiKey) {
        toast.loading('Analyzing image with AI...', { id: 'ai-analysis' });
        const result = await analyzeImage(file);
        toast.dismiss('ai-analysis');
        
        if (result) {
          setAiVisionResult(result);
          toast.success('AI analysis complete!', { icon: '🤖' });
          
          // Auto-fill description if empty and AI found civic issue
          if (!description && result.isCivicIssue && result.description) {
            setDescription(result.description);
          }
        } else if (geminiError) {
          toast.error('AI analysis failed - you can still submit');
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }
    if (!photo) {
      toast.error('Please add a photo');
      return;
    }

    const complaintData = {
      category: selectedCategory.id,
      categoryLabel: selectedCategory.label,
      description: description.trim(),
      photo,
      location,
      // Include Gemini Vision AI analysis if available
      geminiAnalysis: aiVisionResult ? {
        isCivicIssue: aiVisionResult.isCivicIssue,
        category: aiVisionResult.category,
        severity: aiVisionResult.severity,
        confidence: aiVisionResult.confidence,
        department: aiVisionResult.department,
        title: aiVisionResult.title,
        tags: aiVisionResult.tags
      } : null
    };

    const result = await createComplaint(complaintData);
    
    if (result.success) {
      // Store AI analysis result if available
      if (result.data?.aiAnalysis) {
        setAiResult(result.data.aiAnalysis);
      }
      
      setSubmitted(true);
      // Update user stats locally
      updateUser({
        complaintsPosted: (user?.complaintsPosted || 0) + 1,
        points: (user?.points || 0) + 10,
      });
      
      // Longer delay to show AI results
      setTimeout(() => {
        setScreen('complaints');
        setActiveTab('complaints');
      }, 5000);
    } else {
      toast.error(result.error || 'Failed to submit complaint');
    }
  };

  const isValid = description.trim() && photo;

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 animate-fade-in overflow-y-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={48} className="text-green-500" />
        </div>
        <div className="font-extrabold text-xl text-teal text-center">
          Complaint Submitted!
        </div>
        <div className="text-gray-500 text-center text-sm">
          Your complaint has been registered successfully.
        </div>
        <div className="text-teal font-semibold">+10 Points Earned! ⭐</div>
        
        {/* AI Verification Results */}
        {aiResult && (
          <div className="w-full max-w-sm mt-4 space-y-3">
            {/* AI Analysis Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={20} className="text-blue-600" />
                <span className="font-bold text-blue-800">AI Verification</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-semibold ${
                    aiResult.confidence >= 0.70 ? 'text-green-600' : 
                    aiResult.confidence >= 0.50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(aiResult.confidence * 100)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Severity:</span>
                  <span className={`font-semibold capitalize ${
                    aiResult.severity === 'critical' ? 'text-red-600' :
                    aiResult.severity === 'high' ? 'text-orange-600' :
                    aiResult.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {aiResult.severity}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-semibold text-teal">P{aiResult.priority}</span>
                </div>
              </div>
              
              {aiResult.detectedIssues?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-gray-500 mb-1">Issues Detected:</div>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.detectedIssues.map((issue, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Government Notification Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building size={20} className="text-green-600" />
                <span className="font-bold text-green-800">Officials Notified</span>
              </div>
              <p className="text-sm text-gray-600">
                <span className="capitalize">{aiResult.department || 'Municipal'}</span> department officials have been 
                notified and will take action within 24-48 hours.
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <AlertTriangle size={14} />
                <span>Escalation enabled if no action in 48hrs</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          Redirecting to complaints...
        </div>
      </div>
    );
  }

  // Handle location change from LocationMap
  const handleLocationChange = (newLocation) => {
    setLocation({
      coordinates: [newLocation.lng, newLocation.lat],
      address: newLocation.address,
      city: newLocation.city || location.city,
      state: newLocation.state || location.state,
      pincode: newLocation.pincode || location.pincode,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TealHeader
        title={selectedCategory?.label || 'Post a Complaint'}
        onBack={handleBack}
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Duplicate Warning Banner */}
        {showDuplicateWarning && duplicateComplaints.length > 0 && (
          <div className="mx-4 mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-amber-600" />
              <span className="font-bold text-amber-800">Similar Complaint Already Reported</span>
            </div>
            {duplicateComplaints.map((complaint, index) => (
              <div key={index} className="bg-white rounded-lg p-3 mb-2 border border-amber-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {complaint.grv_id || complaint.complaintId}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">• {complaint.categoryLabel}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{complaint.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>📍 {complaint.distanceText}</span>
                  <span>📅 {complaint.daysAgo} days ago</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowDuplicateWarning(false)}
                className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                File Anyway as New Complaint
              </button>
              <button
                onClick={() => {
                  setScreen('complaints');
                  setActiveTab('complaints');
                }}
                className="flex-1 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
              >
                View Existing Complaints
              </button>
            </div>
          </div>
        )}

        {/* Interactive Location Map */}
        <div className="px-4 pt-4">
          <LocationMap
            latitude={location.coordinates[1]}
            longitude={location.coordinates[0]}
            address={location.address}
            aiLocationClues={aiVisionResult?.locationClues}
            onLocationChange={handleLocationChange}
            readonly={false}
          />
        </div>

        {/* Old Map placeholder - keeping as fallback mini indicator */}
        <div className="mx-4 mt-3 h-12 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-between px-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center gap-2 z-10">
            {isLocating ? (
              <Loader size={18} className="text-teal animate-spin" />
            ) : (
              <MapPin size={18} className="text-teal" />
            )}
            <span className="text-xs text-teal font-medium">
              {isLocating ? 'Detecting location...' : 'Location confirmed'}
            </span>
          </div>
          <button 
            onClick={handleRefreshLocation}
            disabled={isLocating}
            className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 z-10"
          >
            <Crosshair size={18} className={`text-gray-600 ${isLocating ? 'animate-pulse' : ''}`} />
          </button>
          {location.plusCode && (
            <div className="absolute bottom-1.5 left-2 text-[11px] text-teal font-mono bg-white/80 px-1.5 py-0.5 rounded">
              {location.plusCode}
            </div>
          )}
          <div className="absolute bottom-1.5 right-2 text-[11px] text-blue-500 font-semibold">
            OpenStreetMap
          </div>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-5">
          {/* Location */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">
              Your Location (auto-detected)
            </label>
            <div className="flex gap-2.5 items-start">
              {isLocating ? (
                <Loader size={20} className="text-teal mt-2.5 shrink-0 animate-spin" />
              ) : (
                <MapPin size={20} className="text-teal mt-2.5 shrink-0" />
              )}
              <div className={`flex-1 border-2 rounded-lg px-3 py-2.5 text-sm bg-white min-h-[44px] leading-relaxed ${
                locationError ? 'border-red-300 text-red-600' : 'border-teal text-gray-700'
              }`}>
                {isLocating ? (
                  <span className="text-gray-400 animate-pulse">Detecting your location...</span>
                ) : (
                  location.address
                )}
              </div>
            </div>
            {locationError && (
              <p className="text-xs text-red-500 mt-1 ml-7">
                {locationError}. <button onClick={handleRefreshLocation} className="underline">Try again</button>
              </p>
            )}
            {location.city && location.state && (
              <p className="text-xs text-gray-400 mt-1 ml-7">
                {location.city}, {location.state} {location.pincode && `- ${location.pincode}`}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">
              Please provide a brief description about the complaint
            </label>
            <div className="flex gap-2.5 items-start">
              <Info size={20} className="text-teal mt-2.5 shrink-0" />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                maxLength={500}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal transition-colors"
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {description.length}/500
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="text-sm text-gray-500 mb-2 block">
              Add a photo
            </label>
            <div className="flex gap-4 items-start">
              <div
                onClick={() => fileRef.current.click()}
                className="w-32 h-28 bg-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer text-white overflow-hidden hover:bg-slate-600 transition-colors relative"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Camera size={32} />
                    <span className="text-[11px] opacity-80 mt-1">+ Add Photo</span>
                  </>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              
              {/* AI Vision Results */}
              {aiVisionResult && (
                <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-800">AI Analysis</span>
                    {aiVisionResult.isCivicIssue ? (
                      <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        ✓ Valid Issue
                      </span>
                    ) : (
                      <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        ✗ Not Civic Issue
                      </span>
                    )}
                  </div>
                  
                  {aiVisionResult.isCivicIssue ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium text-gray-800">{aiVisionResult.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Severity:</span>
                        <span className={`font-bold ${
                          aiVisionResult.severity === 'Critical' ? 'text-red-600' :
                          aiVisionResult.severity === 'High' ? 'text-orange-600' :
                          aiVisionResult.severity === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {aiVisionResult.severity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Confidence:</span>
                        <span className="font-medium text-indigo-700">{aiVisionResult.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-medium text-gray-800">{aiVisionResult.department}</span>
                      </div>
                      {aiVisionResult.title && (
                        <div className="mt-2 pt-2 border-t border-indigo-200">
                          <p className="text-gray-700 font-medium">{aiVisionResult.title}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">
                      This image doesn't appear to show a civic issue. Please upload a photo of the actual problem.
                    </p>
                  )}
                </div>
              )}
              
              {/* AI Analysis Error */}
              {geminiError && !aiVisionResult && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle size={16} />
                    <span className="text-sm font-medium">AI Analysis Failed</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">You can still submit your complaint manually.</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {!isValid && (
            <div className="text-sm text-gray-500 italic">
              Add a description and photo to submit your complaint.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className={`py-3.5 rounded-full border-none font-bold text-base transition-all mt-2 ${
              isValid && !isLoading
                ? 'bg-teal text-white cursor-pointer hover:bg-teal-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
