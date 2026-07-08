import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navigation, Bell, Map, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: "Welcome to StadiaOS",
    description: "Your ultimate smart stadium companion. Never get lost, never miss a moment.",
    icon: Map
  },
  {
    title: "Navigate Seamlessly",
    description: "Find your seat, the shortest food lines, and the nearest washrooms with AI-powered wayfinding.",
    icon: Navigation
  },
  {
    title: "Real-time Alerts",
    description: "Receive instant updates on match events, safety advisories, and facility status directly to your device.",
    icon: Bell
  }
];

export function OnboardingView() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      localStorage.setItem('has_seen_onboarding', 'true');
      navigate('/auth', { replace: true });
    } else {
      setCurrentSlide(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    navigate('/auth', { replace: true });
  };

  return (
    <div className="h-full w-full bg-black text-white relative flex flex-col overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            {(() => {
              const Icon = slides[currentSlide].icon;
              return (
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10">
                  <Icon className="w-10 h-10 text-white/80" />
                </div>
              );
            })()}
            <h1 className="text-3xl font-bold tracking-tight mb-4 text-white/90">
              {slides[currentSlide].title}
            </h1>
            <p className="text-[15px] leading-relaxed text-white/50 max-w-[280px]">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 pb-12 flex flex-col gap-6 relative z-10">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-white/80' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSkip}
            className="flex-1 py-4 text-[13px] font-bold uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
          >
            Skip
          </button>
          <button 
            onClick={handleNext}
            className="flex-[2] py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
