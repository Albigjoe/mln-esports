"use client";
import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (e: Event) => {
      const target = e.target as HTMLImageElement;
      if (target && target.tagName === 'IMG') {
        if (target.dataset.fallbackTriggered) return;
        target.dataset.fallbackTriggered = 'true';

        const name = target.alt || 'MLN';
        const srcUrl = target.src || '';

        // Check if the image looks like a player/user picture
        const isPlayer = 
          srcUrl.includes('/players') || 
          target.className.includes('player') || 
          target.className.includes('rounded-full') || 
          target.className.includes('avatar') ||
          target.className.includes('w-10 h-10') ||
          target.className.includes('w-12 h-12');

        if (isPlayer) {
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00C853&color=000&bold=true`;
        } else {
          // Team or other fallbacks
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=fff&bold=true`;
        }
      }
    };

    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
