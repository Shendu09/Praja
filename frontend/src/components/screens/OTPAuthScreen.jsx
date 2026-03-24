import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader, CheckCircle, User, MapPin, Lock, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getLocationWithAddress } from '../../services/location';

const OTP_LENGTH = 6;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export default function OTPAuthScreen({ role, onBack, onSuccess }) {
  // step: 'choose' → 'contact' → 'otp' → 'details' (signup only)
  const [step, setStep] = useState('choose');
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoOTP, setDemoOTP] = useState('');
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '', location: null });
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
      toast.error(`Please enter your ${authType === 'phone' ? 'phone number' : 'email'}`);
      return;
    }
    if (authType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (authType === 'phone' && !/^[6-9]\d{9}$/.test(identifier)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/otp/send', { identifier, type: authType });

      if (response.success) {
        // Validate intent vs actual account status
        if (isLogin && !response.userExists) {
          toast.error('No account found. Please Create an Account first.', { duration: 4000 });
          setIsLoading(false);
          return;
        }
        if (!isLogin && response.userExists) {
          toast.error('Account already exists. Please Login instead.', { duration: 4000 });
          setIsLoading(false);
          return;
        }

        if (response.devOtp) {
          toast.success(`OTP: ${response.devOtp}`, { duration: 15000, icon: '🔐' });
        } else {
          toast.success(`OTP sent to your ${authType === 'phone' ? 'mobile number' : 'email'}!`);
        }
        setStep('otp');
        setTimer(60);
      }
    } catch (error) {
      // API unavailable — local demo fallback
      setIsDemoMode(true);
      const newOTP = generateOTP();
      setDemoOTP(newOTP);
      await new Promise(r => setTimeout(r, 800));
      toast.success(`OTP (Demo): ${newOTP}`, { duration: 10000, icon: '🔐' });
      setStep('otp');
      setTimer(60);
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

    // Local demo fallback (triggered when API was unreachable during Send OTP)
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (otpValue === demoOTP) {
        toast.success('OTP verified!');
        if (isLogin) {
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
          localStorage.setItem('praja_demo_user', JSON.stringify(mockUser));
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

    if (isDemoMode) {
      const newOTP = generateOTP();
      setDemoOTP(newOTP);
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(`New OTP (Demo): ${newOTP}`, { duration: 10000 });
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/otp/resend', { identifier, type: authType });
      if (response.devOtp) {
        toast.success(`New OTP: ${response.devOtp}`, { duration: 15000, icon: '🔐' });
      } else {
        toast.success('New OTP sent!');
      }
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
        // Token is nested inside response.data for the register endpoint
        localStorage.setItem('praja_token', response.data.token);
        onSuccess(response.data);
      }
    } catch (error) {
      // Demo mode fallback — save user locally when backend is unavailable
      if (isDemoMode) {
        const demoToken = 'demo_token_' + Date.now();
        const demoUser = {
          _id: 'demo_' + Date.now(),
          name: formData.name,
          email: authType === 'email' ? identifier : undefined,
          phone: authType === 'phone' ? identifier : undefined,
          role,
          points: 0,
          complaintsPosted: 0,
          location: formData.location,
        };
        localStorage.setItem('praja_token', demoToken);
        localStorage.setItem('praja_demo_user', JSON.stringify(demoUser));
        toast.success('Registration successful! (Demo Mode)');
        onSuccess(demoUser);
      } else {
        toast.error(error.error || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {

      // ── Step 1: Choose Login or Sign Up ──────────────────────────────────
      case 'choose':
        return (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏛️</div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome to PRAJA</h2>
              <p className="text-gray-500 mt-1 text-sm">Citizen Grievance Management</p>
            </div>

            {/* Login */}
            <button
              onClick={() => { setIsLogin(true); setStep('contact'); }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-teal text-white shadow-lg hover:bg-teal-600 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <LogIn size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Login</div>
                <div className="text-white/80 text-sm">Already have an account? Sign in</div>
              </div>
            </button>

            {/* Sign Up */}
            <button
              onClick={() => { setIsLogin(false); setStep('contact'); }}
              className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-2xl hover:border-teal hover:bg-teal-50 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <UserPlus size={24} className="text-teal" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-gray-800">Create Account</div>
                <div className="text-gray-500 text-sm">New here? Register for free</div>
              </div>
            </button>
          </motion.div>
        );

      // ── Step 2: Enter phone / email ───────────────────────────────────────
      case 'contact':
        return (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <button
              onClick={() => { setStep('choose'); setIdentifier(''); }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} /> Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isLogin ? 'Login to your account' : 'Create your account'}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                {isLogin ? 'Enter your registered contact' : 'Choose how you want to receive OTP'}
              </p>
            </div>

            {/* Phone / Email tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setAuthType('phone'); setIdentifier(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authType === 'phone' ? 'bg-white text-teal shadow' : 'text-gray-500'
                }`}
              >
                📱 Phone
              </button>
              <button
                onClick={() => { setAuthType('email'); setIdentifier(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authType === 'email' ? 'bg-white text-teal shadow' : 'text-gray-500'
                }`}
              >
                ✉️ Email
              </button>
            </div>

            {authType === 'phone' ? (
              <div className="flex gap-2">
                <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold whitespace-nowrap">
                  +91
                </div>
                <input
                  type="tel"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal outline-none text-lg"
                  autoFocus
                />
              </div>
            ) : (
              <input
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal outline-none text-lg"
                autoFocus
              />
            )}

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !identifier}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><Loader size={20} className="animate-spin" />Sending OTP...</>
                : 'Send OTP'
              }
            </button>

            <p className="text-center text-sm text-gray-400">
              {isLogin ? (
                <>New here?{' '}
                  <button
                    onClick={() => { setIsLogin(false); setIdentifier(''); }}
                    className="text-teal font-semibold hover:underline"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button
                    onClick={() => { setIsLogin(true); setIdentifier(''); }}
                    className="text-teal font-semibold hover:underline"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </motion.div>
        );

      // ── Step 3: Verify OTP ────────────────────────────────────────────────
      case 'otp':
        return (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => { setStep('contact'); setOtp(['', '', '', '', '', '']); }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} /> Back
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <Lock size={32} className="text-teal" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Enter OTP</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sent to {authType === 'phone' ? `+91 ${identifier}` : identifier}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-teal outline-none"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.join('').length !== OTP_LENGTH}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><Loader size={20} className="animate-spin" />Verifying...</>
                : 'Verify OTP'
              }
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-gray-500 text-sm">
                  Resend OTP in <span className="font-semibold text-teal">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-teal font-semibold hover:underline text-sm"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        );

      // ── Step 4: Sign Up details (name, location, password) ────────────────
      case 'details':
        return (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
              <p className="text-gray-500 mt-1 text-sm">Just a few more details</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <User size={20} className="text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Location (Auto-detected)</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  {isLocating
                    ? <Loader size={20} className="text-teal animate-spin" />
                    : <MapPin size={20} className="text-teal" />
                  }
                  <span className="flex-1 text-gray-600 text-sm">
                    {isLocating ? 'Detecting...' : formData.location?.formatted || formData.location?.city || 'Not detected'}
                  </span>
                  <button onClick={detectLocation} disabled={isLocating} className="text-xs text-teal font-semibold">
                    Refresh
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Create Password</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <Lock size={20} className="text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Confirm Password</label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-teal">
                  <Lock size={20} className="text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="flex-1 outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full py-3.5 bg-teal text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading
                ? <><Loader size={20} className="animate-spin" />Creating Account...</>
                : 'Create Account'
              }
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Indian tricolor header */}
      <div className="h-2 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        {step === 'choose' && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={20} /> Back to role selection
          </button>
        )}

        {/* Role badge */}
        <div className="text-center mb-6">
          <span className="px-4 py-1.5 bg-teal-100 text-teal rounded-full text-sm font-semibold">
            {role === 'citizen' ? '👤 Citizen' : role === 'official' ? '🏛️ Government Official' : '⚙️ Administrator'}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      {/* Indian tricolor footer */}
      <div className="fixed bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
