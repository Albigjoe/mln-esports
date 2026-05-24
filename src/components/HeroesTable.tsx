'use client';
import { useState } from 'react';
import HeroImage from '@/components/HeroImage';

type HeroStat = {
  hero: string;
  picks: number;
  bans: number;
  wins: number;
  pickRate: number;
  banRate: number;
  presence: number;
  winRate: number;
  kda: number;
  avgDamage: number;
  savages: number;
  maniacs: number;
};

type SortKey = 'hero' | 'picks' | 'bans' | 'pickRate' | 'banRate' | 'presence' | 'winRate' | 'kda' | 'savages';
type SortDir = 'asc' | 'desc';

const tierColor = (presence: number) => {
  if (presence >= 80) return 'text-mln-green border-mln-green bg-mln-green/10';
  if (presence >= 50) return 'text-white border-border-color bg-surface';
  return 'text-gray-400 border-border-color bg-background';
};
const tierLabel = (presence: number) => {
  if (presence >= 80) return 'S';
  if (presence >= 50) return 'A';
  if (presence >= 25) return 'B';
  return 'C';
};

export default function HeroesTable({ heroStats }: { heroStats: HeroStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('presence');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir(key === 'hero' ? 'asc' : 'desc');
    }
  };

  const sorted = [...heroStats].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const SortTh = ({ col, label, className = '' }: { col: SortKey; label: string; className?: string }) => (
    <th
      className={`px-4 py-4 cursor-pointer select-none group hover:text-white transition-colors whitespace-nowrap ${className}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity">
          {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
        </span>
      </span>
    </th>
  );

  return (
    <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border-color flex items-center justify-between">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Full Hero Statistics</h2>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Click any column to sort</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-background text-[10px] uppercase text-gray-400 font-bold tracking-widest">
            <tr>
              <th className="px-4 py-4 w-12">Tier</th>
              <SortTh col="hero" label="Hero" />
              <SortTh col="picks" label="Picks" className="text-center" />
              <SortTh col="bans" label="Bans" className="text-center" />
              <SortTh col="pickRate" label="Pick%" className="text-center" />
              <SortTh col="banRate" label="Ban%" className="text-center" />
              <SortTh col="presence" label="Presence%" className="text-center" />
              <SortTh col="winRate" label="Win%" className="text-center" />
              <SortTh col="kda" label="KDA" className="text-center" />
              <SortTh col="savages" label="Savages" className="text-center" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.hero} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3">
                  <span className={`w-7 h-7 rounded border flex items-center justify-center text-[11px] font-black ${tierColor(h.presence)}`}>
                    {tierLabel(h.presence)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <HeroImage heroName={h.hero} />
                    <span className="font-bold text-white whitespace-nowrap">{h.hero}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-white">{h.picks}</td>
                <td className="px-4 py-3 text-center font-mono text-gray-400">{h.bans}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono text-mln-green font-bold">{h.pickRate}%</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono text-gray-400">{h.banRate}%</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-mln-green rounded-full" style={{ width: `${Math.min(h.presence, 100)}%` }} />
                    </div>
                    <span className="font-mono font-bold text-white text-xs whitespace-nowrap">{h.presence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-mono font-bold text-sm ${h.winRate >= 60 ? 'text-mln-green' : h.winRate <= 40 ? 'text-gray-500' : 'text-white'}`}>
                    {h.picks > 0 ? `${h.winRate}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-white">{h.picks > 0 ? h.kda : '—'}</td>
                <td className="px-4 py-3 text-center">
                  {h.savages > 0 ? (
                    <span className="text-mln-green font-black text-xs">⚡ {h.savages}</span>
                  ) : <span className="text-gray-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
