'use client';

import React, { useState } from 'react';

const HERO_IMG = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/hp_hero/hero_${slug}.png`;
};

export default function HeroImage({ heroName }: { heroName: string }) {
  const [error, setError] = useState(false);

  if (error) {
    // Return a generic fallback icon/avatar or null
    return (
      <div className="w-8 h-8 rounded-full bg-background/80 border border-border-color flex items-center justify-center text-[10px] font-black text-gray-500">
        🛡️
      </div>
    );
  }

  return (
    <img
      src={HERO_IMG(heroName)}
      alt={heroName}
      className="w-8 h-8 rounded-full object-cover bg-background border border-border-color"
      onError={() => setError(true)}
    />
  );
}
