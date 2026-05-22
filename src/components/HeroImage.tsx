'use client';
import { useState } from 'react';

// Generate a stable hue color from a hero's name
function heroColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `${hue}`;
}

export default function HeroImage({ heroName }: { heroName: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hue = heroColor(heroName);

  // Try the mobile legends fandom wiki which redirects to CDN
  const imgSrc = `https://mobile-legends.fandom.com/wiki/Special:FilePath/${encodeURIComponent(heroName)}_hero_portrait.png`;

  return (
    <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden border border-white/10">
      {/* Colored letter avatar — always rendered, fades out if image loads */}
      <div
        className={`absolute inset-0 flex items-center justify-center text-white font-black text-[10px] transition-opacity duration-300 ${imgLoaded && !imgError ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: `linear-gradient(135deg, hsl(${hue},65%,40%), hsl(${hue},65%,25%))` }}
      >
        {heroName.slice(0, 2).toUpperCase()}
      </div>
      {/* External image — fades in on load */}
      {!imgError && (
        <img
          src={imgSrc}
          alt={heroName}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
