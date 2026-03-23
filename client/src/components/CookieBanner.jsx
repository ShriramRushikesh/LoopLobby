import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Delay slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-zinc-900/95 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center shrink-0 hidden md:flex">
                <ShieldCheck className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">We respect your privacy</h4>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
                  We use cookies to serve ads and improve your experience. By continuing, you agree to our 
                  <Link to="/privacy" className="text-pink-400 hover:underline mx-1">Privacy Policy</Link>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link 
                to="/privacy" 
                className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors text-center border border-white/5"
              >
                Learn More
              </Link>
              <button 
                onClick={handleAccept}
                className="flex-1 md:flex-none px-8 py-3 rounded-2xl bg-white text-black text-sm font-bold hover:scale-105 transition-all shadow-lg"
              >
                Accept All
              </button>
            </div>

            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
