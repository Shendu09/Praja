import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowLeft, Loader, CheckCircle, User, MapPin, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getLocationWithAddress } from '../../services/location';

const OTP_LENGTH = 6;
const DEMO_MODE = true; // Enable demo mode - OTP shown directly

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export default function OTPAuthScreen({ role, onBack, onSuccess }) {
  const [step, setStep] = useState('method'); // method -> identifier -> otp -> details -> complete
  const [authType, setAuthType] = useState(null); // 'email' or 'phone'
  const [isLogin, setIsLogin] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [demoOTP, setDemoOTP] = useState(''); // Store demo OTP
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    location: null,
  });
  const [isLocating, setIsLocating] = useState(false);
  
  const otpRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-detect location when reaching details step
  useEffect(() => {
    if (step === 'details' && !formData.location) {
      detectLocation();
    }
  }, [step]);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const locationData = await getLocationWithAddress();
      setFormData((prev) => ({ ...prev, location: locationData }));
      toast.success('Location detected!', { icon: '📍' });
    } catch (error) {
      toast.error(error.message || 'Could not detect location');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      toast.error(`Please enter your ${authType}`);
      return;
    }

    // Validate email
    if (authType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone
    if (authType === 'phone' && !/^[6-9]\d{9}$/.test(identifier)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    
    // Demo mode - generate and show OTP locally
    if (DEMO_MODE) {
      const newOTP = generateOTP();
      setDemoOTP(newOTP);
      
      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`OTP sent! (Demo: ${newOTP})`, { 
        duration: 10000,
        icon: '🔐'
      });
      setStep('otp');
      setTimer(60);
      setIsLoading(false);
      return;
    }

    // Real API call
    try {
      const response = await api.post('/otp/send', {
        identifier,
        type: authType,
        purpose: isLogin ? 'login' : 'register',
      });

      if (response.success) {
        toast.success(`OTP sent to your ${authType}!`);
        setStep('otp');
        setTimer(60);
      }
    } catch (error) {
      toast.error(error.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== OTP_LENGTH) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    
    // Demo mode - verify locally
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (otpValue === demoOTP) {
        toast.success('OTP verified!');
        
        if (isLogin) {
          // Demo login - create mock user
          const mockUser = {
            _id: 'demo_' + Date.now(),
            name: 'Demo User',
            email: authType === 'email' ? identifier : undefined,
            phone: authType === 'phone' ? identifier : undefined,
            role: role,
            points: 100,
            complaintsPosted: 5,
          };
          localStorage.setItem('praja_token', 'demo_token_' + Date.now());
          onSuccess(mockUser);
        } else {
          setStep('details');
        }
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
      setIsLoading(false);
      return;
    }
    
    // Real API call
    try {
      const response = await api.post('/otp/verify', {
        identifier,
        otp: otpValue,
      });

      if (response.success) {
        toast.success('OTP verified!');
        
        if (isLogin) {
          // Direct login after OTP verification
          const loginResponse = await api.post('/auth/otp-login', {
            identifier,
            type: authType,
            role,
          });
          
          if (loginResponse.success) {
            localStorage.setItem('praja_token', loginResponse.token);
            onSuccess(loginResponse.data);
          }
        } else {
          // Move to details step for registration
          setStep('details');
        }
      }
    } catch (error) {
      toast.error(error.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    setIsLoading(true);
    
    // Demo mode
    if (DEMO_MODE) {
      const newOTP = generateOTP();
      setDemoOTP(newOTP);
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(`New OTP sent! (Demo: ${newOTP})`, { duration: 10000 });
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      setIsLoading(false);
      return;
    }
    
    try {
      await api.post('/otp/resend', { identifier, type: authType });
      toast.success('New OTP sent!');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    // Demo mode
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = {
        id: 'demo_' + Date.now(),
        name: formData.name,
        [authType]: identifier,
        role: role,
        location: formData.location || 'Demo Location',
        createdAt: new Date().toISOString()
      };
      toast.success('Registration successful! (Demo Mode)');
      localStorage.setItem('praja_token', 'demo_token_' + Date.now());
      setIsLoading(false);
      onSuccess(mockUser);
      return;
    }
    
    try {
      const registerData = {
        name: formData.name,
        [authType]: identifier,
        password: formData.password,
        role,
        location: formData.location,
      };

      const response = await api.post('/auth/register', registerData);

      if (response.success) {
        toast.success('Registration successful!');
        localStorage.setItem('praja_token', response.token);
        onSuccess(response.data);
      }
    } catch (error) {
      toast.error(error.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'method':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-gray-500 mt-2">
                {isLogin ? 'Login to continue' : 'Register to get started'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setAuthType('email'); setStep('identifier'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-teal hover:bg-teal-50 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Continue with Email</div>
                  <div className="text-sm text-gray-500">We'll send OTP to your email</div>
                </div>
              </button>

              <button
                onClick={() => { setAuthType('phone'); setStep('identifier'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-teal hover:bg-teal-50 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone size={24} className="text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Continue with Phone</div>
                  <div className="text-sm text-gray-500">We'll send OTP to your phone</div>
                </div>
              </button>
            </div>

            <div className="text-center pt-4 border-t">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-teal font-semibold hover:underline"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          </motion.div>
        );

      case 'identifier':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep('method')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                authType === 'email' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {authType === 'email' ? (
                  <Mail size={32} className="text-blue-600" />
                ) : (
                  <Phone size={32} className="text-green-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Enter your {authType === 'email' ? 'Email' : 'Phone Number'}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                We'll send a verification code
              </p>
            </div>

            <div>
              {authType === 'email' ? (
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal outline-none text-lg"
                />
              ) : (
                <div className="flex gap-2">
                  <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal outline-none text-lg"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !identifier}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </motion.div>
        );

      case 'otp':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep('identifier')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <Lock size={32} className="text-teal" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Enter OTP</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sent to {authType === 'email' ? identifier : `+91 ${identifier}`}
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-teal outline-none"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.join('').length !== OTP_LENGTH}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-gray-500">
                  Resend OTP in <span className="font-semibold text-teal">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-teal font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Just a few more details
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <User size={20} className="text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Location (Auto-detected)</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  {isLocating ? (
                    <Loader size={20} className="text-teal animate-spin" />
                  ) : (
                    <MapPin size={20} className="text-teal" />
                  )}
                  <span className="flex-1 text-gray-600 text-sm">
                    {isLocating
                      ? 'Detecting location...'
                      : formData.location?.formatted || formData.location?.city || 'Location not detected'}
                  </span>
                  <button
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="text-xs text-teal font-semibold"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Create Password</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <Lock size={20} className="text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Confirm Password</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <Lock size={20} className="text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Indian colors */}
      <div className="h-2 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        {/* Back button */}
        {step === 'method' && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={20} />
            Back to role selection
          </button>
        )}

        {/* Role indicator */}
        <div className="text-center mb-6">
          <span className="px-4 py-1.5 bg-teal-100 text-teal rounded-full text-sm font-semibold capitalize">
            {role === 'citizen' ? '👤 Citizen' : role === 'official' ? '🏛️ Government Official' : '⚙️ Administrator'}
          </span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Indian colors */}
      <div className="fixed bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
