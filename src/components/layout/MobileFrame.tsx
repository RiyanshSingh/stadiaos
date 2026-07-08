import React from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export const MobileFrame = React.memo(function MobileFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  // Do not apply mobile frame to the Ops Dashboard
  if (location.pathname.startsWith('/ops')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black md:bg-black/95 flex items-center justify-center p-0 md:p-8">
      <div className="w-full min-h-screen md:min-h-0 md:w-[406px] md:h-[725px] md:rounded-[40px] md:overflow-hidden md:border-[8px] md:border-[#1a1a1a] md:shadow-[0_0_50px_rgba(0,0,0,0.5)] md:ring-1 md:ring-white/10 relative bg-black md:transform-gpu flex flex-col">
        <div id="scroll-container" className="flex-1 md:overflow-y-auto overflow-x-hidden relative hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
});
