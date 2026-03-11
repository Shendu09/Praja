import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, QrCode, MapPin, Star, Search, X, Check, Camera, AlertCircle,
  Building2, Droplets, Trash2, TreePine, Lightbulb, Bus, Heart, Keyboard,
  Download, Share2, ExternalLink, Clock, Users, ChevronRight, Smartphone,
  Shield, Sparkles, Trophy, Eye, Copy, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { buildRatingUrl, getBaseUrl } from '../../config/ngrok';

// Service categories with professional styling - maps to database category names
const serviceCategories = [
  { id: 'Public Toilet', name: 'Public Toilet', icon: '🚻', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { id: 'Water Supply', name: 'Water Supply', icon: '💧', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { id: 'Waste Collection', name: 'Waste Collection', icon: '🗑️', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  { id: 'Public Transport', name: 'Public Transport', icon: '🚌', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { id: 'Park & Garden', name: 'Park & Garden', icon: '🌳', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
  { id: 'Street Light', name: 'Street Light', icon: '💡', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { id: 'Govt Hospital', name: 'Govt Hospital', icon: '🏥', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { id: 'Govt Office', name: 'Govt Office', icon: '🏛️', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
];

// Helper function to find category by name
const findCategoryByName = (categoryName) => {
  return serviceCategories.find(cat => cat.id === categoryName || cat.name === categoryName);
};

// Public Rating Component - For QR scanned access
export function PublicRatingPage({ serviceId, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    cleanliness: false,
    facilities: false,
    safety: false,
    staffBehavior: false,
    accessibility: false,
  });

  const result = findServiceById(serviceId);
  const service = result?.service;
  const category = result?.category;

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-6">The service ID "{serviceId}" is not valid.</p>
          <button onClick={onClose} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    console.log('Public rating submitted:', { serviceId, rating, comment, checkboxes });
    setSubmitted(true);
    toast.success('Thank you for your feedback!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check size={48} className="text-emerald-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your feedback helps improve public services for everyone.</p>
          <div className="flex items-center justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={32} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
            ))}
          </div>
          <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className={`${category.color} text-white px-6 py-8`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <p className="text-white/70 text-sm">{category.name}</p>
              <h1 className="text-xl font-bold">{service.name}</h1>
            </div>
          </div>
          <p className="text-white/80 text-sm flex items-center gap-2">
            <MapPin size={14} /> {service.address}
          </p>
        </div>
      </div>

      {/* Rating Form */}
      <div className="max-w-lg mx-auto px-4 py-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-4">Rate your experience</h3>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {rating === 0 ? 'Tap to rate' : rating === 1 ? '😞 Poor' : rating === 2 ? '😐 Fair' : rating === 3 ? '🙂 Good' : rating === 4 ? '😊 Very Good' : '🤩 Excellent!'}
            </p>
          </div>

          {/* Quick Feedback */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">What stood out?</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'cleanliness', label: '✨ Cleanliness' },
                { key: 'facilities', label: '🛠️ Facilities' },
                { key: 'safety', label: '🛡️ Safety' },
                { key: 'staffBehavior', label: '👥 Staff' },
                { key: 'accessibility', label: '♿ Access' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setCheckboxes(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    checkboxes[item.key] ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Additional comments</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Submit Rating
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Powered by PRAJA - Citizen Feedback System
        </p>
      </div>
    </div>
  );
}

export default function RateServiceScreen({ onBack }) {
  const [view, setView] = useState('categories'); // categories, services, qrModal, scanner, rateForm
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Services data from API
  const [allServices, setAllServices] = useState({}); // Grouped by category
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState(null);

  // Rating form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [checkboxes, setCheckboxes] = useState({
    cleanliness: false,
    facilities: false,
    safety: false,
    staffBehavior: false,
    accessibility: false,
  });
  const [comment, setComment] = useState('');

  // Fetch services from API on mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      setServicesError(null);
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        if (data.success) {
          setAllServices(data.data);
        } else {
          setServicesError(data.message || 'Failed to load services');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServicesError('Failed to load services. Please try again.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Get services for selected category (uses category name as key)
  const services = selectedCategory ? (allServices[selectedCategory.id] || []) : [];
  
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to find service by serviceId across all categories
  const findServiceInData = (serviceId) => {
    for (const categoryName of Object.keys(allServices)) {
      const categoryServices = allServices[categoryName] || [];
      const found = categoryServices.find(s => s.serviceId === serviceId);
      if (found) {
        const category = findCategoryByName(categoryName);
        return { service: found, category };
      }
    }
    return null;
  };

  // Generate QR code URL for a service (uses /rate/:serviceId route)
  const getQRUrl = (serviceId) => {
    return buildRatingUrl(serviceId);
  };

  // Copy URL to clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  // Download QR as image
  const downloadQR = (serviceId, serviceName) => {
    const svg = document.getElementById(`qr-${serviceId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${serviceName.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    toast.success('QR Code downloaded!');
  };

  // Start QR Scanner
  const startScanner = async () => {
    setView('scanner');
    setIsScanning(true);
    setScanError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleQRResult(decodedText),
        () => {}
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScanError("Camera not available. Use manual entry below.");
      setIsScanning(false);
      setShowManualEntry(true);
    }
  };

  // Stop QR Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
    }
    setIsScanning(false);
  };

  // Handle QR scan result
  const handleQRResult = async (result) => {
    await stopScanner();
    
    // Extract service ID from URL or direct ID
    let serviceId = result;
    if (result.includes('rate=')) {
      const url = new URL(result);
      serviceId = url.searchParams.get('rate');
    } else if (result.includes('/rate/')) {
      // Handle /rate/:serviceId format
      const parts = result.split('/rate/');
      serviceId = parts[parts.length - 1];
    }
    
    // Find matching service in loaded data
    const found = findServiceInData(serviceId);
    if (found) {
      setSelectedCategory(found.category);
      setSelectedService(found.service);
      setView('rateForm');
      toast.success(`Service found: ${found.service.name}`);
    } else {
      toast.error('Service not found. Please try again.');
      setView('categories');
    }
  };

  // Handle manual QR entry
  const handleManualEntry = () => {
    if (!manualQRCode.trim()) {
      toast.error('Please enter a service code');
      return;
    }
    handleQRResult(manualQRCode.trim().toUpperCase());
  };

  // Select service
  const selectService = (service) => {
    setSelectedService(service);
    setView('rateForm');
  };

  // Open QR modal
  const openQRModal = (service) => {
    setSelectedService(service);
    setShowQRModal(true);
  };

  // Submit rating
  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please give a star rating');
      return;
    }

    const ratingData = {
      serviceId: selectedService.serviceId,
      serviceName: selectedService.name,
      category: selectedCategory?.id,
      rating,
      feedback: checkboxes,
      comment,
      timestamp: new Date().toISOString()
    };

    console.log('Rating submitted:', ratingData);
    toast.success('Thank you for your rating! +10 XP earned');
    
    // Reset
    setRating(0);
    setCheckboxes({
      cleanliness: false,
      facilities: false,
      safety: false,
      staffBehavior: false,
      accessibility: false,
    });
    setComment('');
    setSelectedService(null);
    setSelectedCategory(null);
    setView('categories');
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Render stars
  const renderStars = (size = 44) => (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={`${
              star <= (hoverRating || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );

  // Render content based on view
  const renderContent = () => {
    switch (view) {
      case 'categories':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-6"
          >
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Rate Public Services</h2>
                  <p className="text-white/80 text-sm">Select a category to view services and their QR codes</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <QrCode size={28} />
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Eye size={16} />
                  <span className="text-sm">View QR</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Smartphone size={16} />
                  <span className="text-sm">Scan & Rate</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Trophy size={16} />
                  <span className="text-sm">Earn XP</span>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              Select Category
              {loadingServices && (
                <span className="ml-2 text-xs text-gray-400 flex items-center gap-1">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </span>
              )}
            </h3>

            {servicesError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                ⚠️ {servicesError}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {serviceCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedCategory(cat); setView('services'); }}
                  className={`${cat.lightColor} ${cat.borderColor} border-2 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all`}
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className={`font-semibold text-sm ${cat.textColor}`}>{cat.name}</span>
                  <span className="text-xs text-gray-500">
                    {allServices[cat.id]?.length || 0} locations
                  </span>
                </motion.button>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <QrCode size={20} /> How QR Rating Works
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p className="text-sm text-white/80">Select a category and find the service</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p className="text-sm text-white/80">Click the QR button to view the service QR code</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <p className="text-sm text-white/80">Scan QR with any phone camera to open the rating page</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-indigo-600">1,234</div>
                <div className="text-xs text-gray-500">Total Ratings</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-emerald-600">4.2</div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-amber-600">+50 XP</div>
                <div className="text-xs text-gray-500">This Week</div>
              </div>
            </div>
          </motion.div>
        );

      case 'services':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
          >
            {/* Category Header */}
            <div className={`${selectedCategory.color} text-white px-4 py-5`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedCategory.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{selectedCategory.name}</h2>
                  <p className="text-white/70 text-sm">{services.length} locations - Scan QR codes below</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-white shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Services List with QR Codes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredServices.map((service) => (
                <motion.div
                  key={service.serviceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                >
                  {/* Service Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{service.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            service.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {service.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={14} /> {service.address}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center">
                            {[1,2,3,4,5].map(star => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= Math.round(service.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-gray-700 text-sm">{service.averageRating || 'New'}</span>
                          <span className="text-gray-400 text-xs">({service.totalRatings || 0})</span>
                        </div>
                      </div>
                      <span className="text-indigo-600 font-semibold text-sm bg-indigo-50 px-3 py-1 rounded-lg">
                        {service.ward || service.city || 'Kadapa'}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Section - Prominently Displayed */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-4">
                      {/* QR Code */}
                      <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-200">
                        <QRCodeSVG
                          id={`qr-${service.serviceId}`}
                          value={getQRUrl(service.serviceId)}
                          size={100}
                          level="H"
                          includeMargin={false}
                          fgColor="#1f2937"
                        />
                      </div>

                      {/* QR Info & Actions */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          📱 <span className="font-medium">Scan this QR</span> with any phone camera to rate this service
                        </p>
                        <p className="text-xs text-gray-400 font-mono mb-3 bg-gray-100 px-2 py-1 rounded inline-block">
                          ID: {service.serviceId}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(getQRUrl(service.serviceId))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors"
                          >
                            <Copy size={14} /> Copy Link
                          </button>
                          <button
                            onClick={() => downloadQR(service.serviceId, service.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
                          >
                            <Download size={14} /> Download
                          </button>
                          <button
                            onClick={() => openQRModal(service)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            <ExternalLink size={14} /> Expand
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rate Button */}
                  <div className="p-3 bg-white border-t border-gray-100">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectService(service)}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Star size={18} /> Rate This Service Now
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {filteredServices.length === 0 && !loadingServices && (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No services found</p>
                  <p className="text-xs text-gray-400 mt-2">Try a different category or add services from admin panel</p>
                </div>
              )}

              {loadingServices && (
                <div className="text-center py-12">
                  <Loader2 size={48} className="mx-auto mb-3 text-indigo-400 animate-spin" />
                  <p className="text-gray-500">Loading services...</p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="p-4 bg-white border-t">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(''); setView('categories'); }}
                className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back to Categories
              </button>
            </div>
          </motion.div>
        );

      case 'rateForm':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Service Card */}
              <div className={`${selectedCategory?.color || 'bg-gray-500'} rounded-2xl p-5 text-white`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedCategory?.icon || '📍'}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{selectedService?.name}</h3>
                    <p className="text-sm text-white/80 flex items-center gap-1">
                      <MapPin size={14} /> {selectedService?.address}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-white/70 text-sm">Current Rating</span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-amber-300 text-amber-300" />
                    <span className="font-bold">{selectedService?.rating}</span>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4 text-center">How would you rate this service?</h4>
                {renderStars()}
                <motion.p
                  key={rating}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4"
                >
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    rating === 0 ? 'bg-gray-100 text-gray-500' :
                    rating <= 2 ? 'bg-red-100 text-red-600' :
                    rating === 3 ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {rating === 0 ? 'Tap a star to rate' : 
                     rating === 1 ? '😞 Poor' :
                     rating === 2 ? '😐 Fair' :
                     rating === 3 ? '🙂 Good' :
                     rating === 4 ? '😊 Very Good' : '🤩 Excellent!'}
                  </span>
                </motion.p>
              </div>

              {/* Quick Feedback */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-3">What stood out?</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'cleanliness', label: '✨ Cleanliness' },
                    { key: 'facilities', label: '🛠️ Facilities' },
                    { key: 'safety', label: '🛡️ Safety' },
                    { key: 'staffBehavior', label: '👥 Staff Behavior' },
                    { key: 'accessibility', label: '♿ Accessibility' },
                  ].map((item) => (
                    <motion.button
                      key={item.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCheckboxes(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        checkboxes[item.key]
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-3">Additional Comments</h4>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience to help others..."
                  rows={3}
                  className="w-full p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none border border-gray-200"
                />
              </div>

              {/* Reward Preview */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={24} />
                    <span className="font-semibold">You'll earn:</span>
                  </div>
                  <span className="text-2xl font-bold">+10 XP</span>
                </div>
              </div>
            </div>

            {/* Submit Area */}
            <div className="p-4 bg-white border-t space-y-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg"
              >
                Submit Rating
              </motion.button>
              <button
                onClick={() => { setSelectedService(null); setView(selectedCategory ? 'services' : 'categories'); }}
                className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // QR Modal
  const QRModal = () => (
    <AnimatePresence>
      {showQRModal && selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl text-gray-800">Service QR Code</h3>
                <p className="text-gray-500 text-sm">Scan to rate on any device</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Service Info */}
            <div className={`${selectedCategory?.lightColor} ${selectedCategory?.borderColor} border-2 rounded-xl p-4 mb-6`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCategory?.icon}</span>
                <div>
                  <h4 className={`font-bold ${selectedCategory?.textColor}`}>{selectedService.name}</h4>
                  <p className="text-gray-500 text-sm">{selectedService.address}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl shadow-inner border-2 border-dashed border-gray-200 mb-6">
              <div className="flex justify-center">
                <QRCodeSVG
                  id={`qr-${selectedService.serviceId}`}
                  value={getQRUrl(selectedService.serviceId)}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#1f2937"
                />
              </div>
              <p className="text-center text-gray-500 text-sm mt-4 font-mono bg-gray-100 py-2 rounded-lg">
                {selectedService.serviceId}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => downloadQR(selectedService.serviceId, selectedService.name)}
                className="flex items-center justify-center gap-2 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-semibold"
              >
                <Download size={18} /> Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => copyToClipboard(getQRUrl(selectedService.serviceId))}
                className="flex items-center justify-center gap-2 py-3 bg-purple-100 text-purple-700 rounded-xl font-semibold"
              >
                <Copy size={18} /> Copy Link
              </motion.button>
            </div>

            {/* URL Display */}
            <div className="bg-gray-100 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Rating URL:</p>
              <p className="text-sm text-gray-700 font-mono break-all">{getQRUrl(selectedService.serviceId)}</p>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm">
                📱 Scan this QR code with any smartphone camera to rate this service
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (view === 'categories') onBack();
            else if (view === 'services') { setSelectedCategory(null); setSearchQuery(''); setView('categories'); }
            else if (view === 'rateForm') setView(selectedCategory ? 'services' : 'categories');
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Rate Public Service</h1>
          <p className="text-xs text-white/60">View QR codes & rate services</p>
        </div>
        <div className="p-2 bg-white/10 rounded-full">
          <QrCode size={22} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* QR Modal */}
      <QRModal />
    </div>
  );
}
