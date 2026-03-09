import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, QrCode, MapPin, Star, Search, X, Check, Camera, AlertCircle,
  Building2, Droplets, Trash2, TreePine, Lightbulb, Bus, Heart, Keyboard
} from 'lucide-react';
import toast from 'react-hot-toast';

// Service categories
const serviceCategories = [
  { id: 'toilet', name: 'Public Toilet', icon: '🚻', color: 'from-teal-500 to-teal-600' },
  { id: 'water', name: 'Water Supply', icon: '💧', color: 'from-blue-500 to-blue-600' },
  { id: 'waste', name: 'Waste Collection', icon: '🗑️', color: 'from-green-500 to-green-600' },
  { id: 'transport', name: 'Public Transport', icon: '🚌', color: 'from-amber-500 to-amber-600' },
  { id: 'park', name: 'Park/Garden', icon: '🌳', color: 'from-emerald-500 to-emerald-600' },
  { id: 'street', name: 'Street Light', icon: '💡', color: 'from-yellow-500 to-yellow-600' },
  { id: 'hospital', name: 'Govt Hospital', icon: '🏥', color: 'from-red-500 to-red-600' },
  { id: 'office', name: 'Govt Office', icon: '🏛️', color: 'from-purple-500 to-purple-600' },
];

// Dummy service locations
const dummyServices = {
  toilet: [
    { id: 'TOI001', name: 'Community Toilet - Sector 5', distance: '0.3 km', rating: 4.2, address: 'Near Park Gate, Sector 5' },
    { id: 'TOI002', name: 'Public Toilet - Bus Stand', distance: '0.8 km', rating: 3.8, address: 'Central Bus Station' },
    { id: 'TOI003', name: 'SBM Toilet - Market', distance: '1.2 km', rating: 4.5, address: 'Main Market, Block A' },
  ],
  water: [
    { id: 'WAT001', name: 'Water Tank - Ward 5', distance: '0.2 km', rating: 4.0, address: 'Community Center' },
    { id: 'WAT002', name: 'Bore Well - Sector 12', distance: '0.5 km', rating: 3.5, address: 'Near School' },
  ],
  waste: [
    { id: 'WST001', name: 'Waste Bin - Main Road', distance: '0.1 km', rating: 3.2, address: 'Bus Stop Area' },
    { id: 'WST002', name: 'Collection Point - Market', distance: '0.4 km', rating: 4.1, address: 'Market Exit' },
  ],
  transport: [
    { id: 'TRN001', name: 'Bus Stop - Central', distance: '0.3 km', rating: 3.9, address: 'Main Road Junction' },
    { id: 'TRN002', name: 'Auto Stand - Station', distance: '0.6 km', rating: 3.5, address: 'Railway Station' },
  ],
  park: [
    { id: 'PRK001', name: 'Central Park', distance: '0.5 km', rating: 4.5, address: 'Sector 5 Main' },
    { id: 'PRK002', name: 'Children Garden', distance: '0.8 km', rating: 4.2, address: 'Near School' },
  ],
  street: [
    { id: 'STR001', name: 'Street Light - Main Road', distance: '0.1 km', rating: 3.8, address: 'Junction Point' },
    { id: 'STR002', name: 'Street Light - Colony', distance: '0.2 km', rating: 4.0, address: 'Residential Area' },
  ],
  hospital: [
    { id: 'HSP001', name: 'PHC - Ward 10', distance: '1.2 km', rating: 3.6, address: 'Main Market Road' },
    { id: 'HSP002', name: 'District Hospital', distance: '2.5 km', rating: 4.0, address: 'Hospital Road' },
  ],
  office: [
    { id: 'OFF001', name: 'Municipal Office', distance: '1.0 km', rating: 3.4, address: 'Collectorate Complex' },
    { id: 'OFF002', name: 'Tehsil Office', distance: '1.5 km', rating: 3.2, address: 'Tehsil Road' },
  ],
};

export default function RateServiceScreen({ onBack }) {
  const [view, setView] = useState('categories'); // categories, options, scanner, search, rateForm
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualQRCode, setManualQRCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const html5QrCodeRef = useRef(null);

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

  // Get services for selected category
  const services = selectedCategory ? (dummyServices[selectedCategory.id] || []) : [];
  
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    
    // Find matching service across all categories
    let foundService = null;
    for (const category of serviceCategories) {
      const categoryServices = dummyServices[category.id] || [];
      foundService = categoryServices.find(s => s.id === result || result.includes(s.id));
      if (foundService) {
        setSelectedCategory(category);
        break;
      }
    }

    if (!foundService) {
      foundService = {
        id: result,
        name: `Service - ${result}`,
        distance: 'Scanned',
        rating: 0,
        address: 'Location scanned via QR',
        isNew: true
      };
    }

    setSelectedService(foundService);
    setView('rateForm');
    toast.success(`Service identified: ${foundService.name}`);
  };

  // Handle manual QR entry
  const handleManualEntry = () => {
    if (!manualQRCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }
    handleQRResult(manualQRCode.trim().toUpperCase());
  };

  // Select service from search
  const selectService = (service) => {
    setSelectedService(service);
    setView('rateForm');
  };

  // Submit rating
  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please give a star rating');
      return;
    }

    const ratingData = {
      serviceId: selectedService.id,
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
  const renderStars = () => (
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
            size={44}
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
            className="p-6"
          >
            <p className="text-gray-600 text-center mb-6">
              Select a service type to rate
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {serviceCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedCategory(cat); setView('options'); }}
                  className={`bg-gradient-to-br ${cat.color} rounded-2xl p-5 text-white shadow-lg aspect-square flex flex-col items-center justify-center gap-2`}
                >
                  <span className="text-4xl">{cat.icon}</span>
                  <span className="font-semibold text-sm text-center">{cat.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-2">🏆 Earn Rewards!</h4>
              <p className="text-sm text-purple-700">
                Rate services to earn XP and climb the leaderboard. Top raters get featured on the Civic Heroes wall!
              </p>
            </div>
          </motion.div>
        );

      case 'options':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-5"
          >
            <div className="text-center">
              <span className="text-5xl">{selectedCategory?.icon}</span>
              <h3 className="font-bold text-xl text-gray-800 mt-2">{selectedCategory?.name}</h3>
              <p className="text-gray-500">How would you like to find the service?</p>
            </div>

            {/* Scan QR */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startScanner}
              className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <QrCode size={32} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg">Scan QR Code</h3>
                  <p className="text-sm text-white/80">Scan the QR code at the service location</p>
                </div>
              </div>
            </motion.button>

            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('search')}
              className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <MapPin size={32} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg">Search by Location</h3>
                  <p className="text-sm text-white/80">Find nearby services to rate</p>
                </div>
              </div>
            </motion.button>

            <button
              onClick={() => { setSelectedCategory(null); setView('categories'); }}
              className="w-full py-3 text-gray-500 hover:text-gray-700"
            >
              ← Back to categories
            </button>
          </motion.div>
        );

      case 'scanner':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-gray-900"
          >
            <div className="flex-1 relative">
              <div id="qr-reader" className="w-full h-full"></div>
              
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>
                      
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(scanError || showManualEntry) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 p-6">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                    <AlertCircle className="text-amber-500 mx-auto mb-3" size={48} />
                    <p className="text-gray-700 text-center mb-4">{scanError || "Can't access camera?"}</p>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 text-center">Enter QR code manually:</p>
                      <input
                        type="text"
                        value={manualQRCode}
                        onChange={(e) => setManualQRCode(e.target.value.toUpperCase())}
                        placeholder="e.g., TOI001, WAT002"
                        className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                      />
                      <button
                        onClick={handleManualEntry}
                        className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold"
                      >
                        Submit Code
                      </button>
                      <button
                        onClick={() => { stopScanner(); setView('options'); setShowManualEntry(false); }}
                        className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!scanError && !showManualEntry && (
              <div className="bg-gray-900 p-6 text-center space-y-3">
                <p className="text-white">{isScanning ? 'Scanning...' : 'Starting camera...'}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="px-6 py-2 bg-white/10 text-white rounded-full flex items-center gap-2"
                  >
                    <Keyboard size={18} /> Enter Manually
                  </button>
                  <button
                    onClick={() => { stopScanner(); setView('options'); }}
                    className="px-6 py-2 bg-white/20 text-white rounded-full"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 'search':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
          >
            <div className="p-4 bg-white shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredServices.map((service) => (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectService(service)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{service.address}</p>
                    </div>
                    <span className="text-indigo-600 font-medium text-sm bg-indigo-50 px-2 py-1 rounded-lg">{service.distance}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${
                          star <= Math.round(service.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">({service.rating})</span>
                  </div>
                </motion.button>
              ))}

              {filteredServices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <MapPin size={48} className="mx-auto mb-3 opacity-30" />
                  No services found matching your search
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t">
              <button
                onClick={() => setView('options')}
                className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                ← Back to Options
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Service info */}
              <div className={`bg-gradient-to-br ${selectedCategory?.color || 'from-gray-500 to-gray-600'} rounded-2xl p-5 text-white`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedCategory?.icon || '📍'}</span>
                  <div>
                    <h3 className="font-bold text-lg">{selectedService?.name}</h3>
                    <p className="text-sm text-white/80">{selectedService?.address}</p>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="text-center py-4">
                <h4 className="font-semibold text-gray-700 mb-4">How would you rate this service?</h4>
                {renderStars()}
                <p className="text-sm text-gray-500 mt-3">
                  {rating === 0 ? 'Tap to rate' : 
                   rating === 1 ? '😞 Poor' :
                   rating === 2 ? '😐 Fair' :
                   rating === 3 ? '🙂 Good' :
                   rating === 4 ? '😊 Very Good' : '🤩 Excellent!'}
                </p>
              </div>

              {/* Checkboxes */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">What stood out? (Optional)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'cleanliness', label: '✨ Cleanliness' },
                    { key: 'facilities', label: '🛠️ Facilities' },
                    { key: 'safety', label: '🛡️ Safety' },
                    { key: 'staffBehavior', label: '👥 Staff' },
                    { key: 'accessibility', label: '♿ Access' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setCheckboxes(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        checkboxes[item.key]
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Additional Comments</h4>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience to help others..."
                  rows={3}
                  className="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* XP Preview */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-medium">🏆 You'll earn:</span>
                  <span className="text-amber-600 font-bold">+10 XP</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t space-y-2">
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Submit Rating
              </button>
              <button
                onClick={() => { setSelectedService(null); setView('options'); }}
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

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      {view !== 'scanner' && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 flex items-center gap-3 shadow-lg">
          <button
            onClick={() => {
              if (view === 'categories') onBack();
              else if (view === 'options') { setSelectedCategory(null); setView('categories'); }
              else if (view === 'search') setView('options');
              else if (view === 'rateForm') setView('options');
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Rate Public Service</h1>
            <p className="text-xs text-white/70">Help improve civic infrastructure</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}
