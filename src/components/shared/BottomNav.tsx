import { useState, useEffect, memo } from 'react'
import { Home, Compass, MessageSquare, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const BottomNav = memo(function BottomNav() {
  const location = useLocation()
  const [hidden, setHidden] = useState(false)
  
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const container = (isDesktop ? document.getElementById('scroll-container') : window) || window;
    
    let lastY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
    
    const handleScroll = () => {
      const currentY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      if (currentY > lastY && currentY > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY = currentY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Compass, path: '/map', label: 'Map' },
    { icon: MessageSquare, path: '/copilot', label: 'Copilot' },
    { icon: User, path: '/profile', label: 'Profile' }, 
  ]

  return (
    <motion.div 
      variants={{
        visible: { y: 0, x: "-50%", opacity: 1 },
        hidden: { y: 100, x: "-50%", opacity: 0 }
      }}
      initial="visible"
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm px-6"
    >
      <nav aria-label="Main Navigation" className="glass-nav relative flex items-center justify-between p-2 h-[72px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors h-full z-10",
                isActive ? "text-white" : "text-white/70 hover:text-white/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative z-10 p-2"
              >
                <item.icon 
                  className={cn("w-6 h-6 transition-all duration-300", isActive ? "drop-shadow-lg" : "")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
});
