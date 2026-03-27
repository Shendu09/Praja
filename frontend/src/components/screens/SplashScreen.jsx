import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100
    const duration = 3000; // 3 seconds
    const interval = 30;
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a1628] flex flex-col items-center justify-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-full" />
        <div className="absolute top-40 right-32 w-20 h-20 border border-white/10 rounded-full" />
        <div className="absolute bottom-32 left-40 w-24 h-24 border border-white/10 rounded-full" />
        <div className="absolute top-1/3 left-1/4 text-white/5 text-6xl">*</div>
        <div className="absolute bottom-1/3 right-1/4 text-white/5 text-4xl">*</div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Glassmorphism Card */}
        <div className="relative w-[380px] md:w-[420px] rounded-3xl overflow-hidden">
          {/* Card background with green tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a]/90 to-[#0d1f18]/90 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          
          {/* Card content */}
          <div className="relative px-10 py-12">
            {/* Main Title - Hindi */}
            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold text-center text-white/90 mb-4"
              style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}
            >
              प्रजा
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-white/60 text-sm tracking-[0.3em] uppercase mb-10"
            >
              Citizen Grievance Portal
            </motion.p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Progress Text */}
            <div className="flex justify-between items-center text-white/50 text-sm">
              <span>Launching portal</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Digital India Badge */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-10"
      >
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
          <span className="text-white/40 font-bold text-sm">IN</span>
          <span className="text-white/40 text-sm tracking-wider uppercase">Digital India Initiative</span>
        </div>
      </motion.div>
    </div>
  );
}
