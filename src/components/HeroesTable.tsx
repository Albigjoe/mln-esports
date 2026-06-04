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

type SortKey = 'hero' | 'picks' | 'pickRate' | 'bans' | 'banRate' | 'wins' | 'winRate';
type SortDir = 'asc' | 'desc';

export default function HeroesTable({ heroStats, totalGames }: { heroStats: HeroStat[]; totalGames: number }) {
  const [sortKey, setSortKey] = useState<SortKey>('picks');
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

  const total = Math.max(totalGames, 1);

  return (
    <div className="bg-surface border border-border-color rounded-xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-border-color flex items-center justify-between">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Heroes Statistics</h2>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Click any column to sort</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[900px] text-left text-sm border-collapse">
          <thead className="bg-background text-[10px] uppercase text-gray-400 font-bold tracking-widest border-b border-border-color">
            <tr>
              <SortTh col="hero" label="Hero" className="pl-6" />
              <SortTh col="picks" label="Pick" className="text-center" />
              <SortTh col="pickRate" label="Pick Rate" className="text-center" />
              <SortTh col="bans" label="Ban" className="text-center" />
              <SortTh col="banRate" label="Ban Rate" className="text-center" />
              <SortTh col="wins" label="Win" className="text-center" />
              <SortTh col="winRate" label="Win Rate" className="text-center" />
              <th className="px-4 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const pickRateVal = (h.picks / total) * 100;
              const banRateVal = (h.bans / total) * 100;
              const mb = banRateVal >= 40 && h.bans >= 2;
              const mp = pickRateVal >= 30 && h.picks >= 2 && h.winRate >= 60;

              return (
                <tr key={h.hero} className="border-b border-border-color/60 hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <HeroImage heroName={h.hero} className="w-9 h-9 rounded-full border border-border-color" />
                      <span className="font-bold text-white whitespace-nowrap">{h.hero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-white">{h.picks}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-mln-green font-bold">{h.pickRate.toFixed(2)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-400">{h.bans}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-gray-400">{h.banRate.toFixed(2)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-white">{h.wins}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono font-bold text-sm ${h.winRate >= 60 ? 'text-mln-green' : h.winRate <= 40 ? 'text-red-400' : 'text-white'}`}>
                      {h.picks > 0 ? `${h.winRate.toFixed(2)}%` : '0.00%'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {mb && (
                        <span className="inline-block bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          Must Ban
                        </span>
                      )}
                      {mp && (
                        <span className="inline-block bg-mln-green/10 border border-mln-green/30 text-mln-green text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          Must Pick
                        </span>
                      )}
                      {!mb && !mp && <span className="text-gray-600 font-mono text-xs">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
