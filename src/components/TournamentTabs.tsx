"use client";
import { useState } from 'react';
import { getHeroImage, getPlayerImage } from '@/lib/utils';
import Link from 'next/link';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];

const ARCHETYPES: Record<string, string[]> = {
  roamer_damage: ['Chou', 'Jawhead', 'Natalia', 'Saber', 'Benedetta', 'Ruby', 'Silvanna', 'Joy', 'Phoveus', 'Martis', 'Ling', 'Guinevere', 'Akai', 'Karina', 'Zilong', 'Alpha'],
  roamer_support: ['Atlas', 'Franco', 'Khufra', 'Tigreal', 'Lolita', 'Johnson', 'Hylos', 'Grock', 'Belerick', 'Minotaur', 'Baxia', 'Chip', 'Carmilla', 'Angela', 'Mathilda', 'Floryn', 'Rafaela', 'Diggie', 'Faramis', 'Kaja', 'Kalea', 'Edith', 'Alice', 'Hilda', 'Uranus', 'Fredrinn'],
  jungle_carry: ['Lancelot', 'Fanny', 'Hayabusa', 'Gusion', 'Ling', 'Harith', 'Roger', 'Karrie', 'Wanwan', 'Karina', 'Aamon', 'Nolan', 'Joy', 'Benedetta', 'Hanzo', 'Saber', 'Yi Sun-shin', 'Zilong', 'Alucard', 'Aldous', 'Julian', 'Paquito', 'Chou', 'Khaleed', 'Natalia', 'Helcurt', 'Selena', 'Granger', 'Brody', 'Beatrix', 'Lesley', 'Claude', 'Clint', 'Irithel', 'Ixia', 'Moskov', 'Popol and Kupa'],
  jungle_tank: ['Barats', 'Fredrinn', 'Hilda', 'Freya', 'Gatotkaca', 'Bane', 'Thamuz', 'Badang', 'Masha', 'Ruby', 'Terizla', 'Dyrroth'],
  mid_damage: ['Pharsa', 'Xavier', 'Yve', 'Vale', 'Valir', 'Odette', 'Lylia', 'Lunox', 'Eudora', 'Aurora', 'Cyclops', 'Gord', 'Novaria', "Chang'e", 'Kimmy', 'Vexana', 'Harith', 'Natan', 'Melissa'],
  mid_utility: ['Zhuxin', 'Zetian', 'Kagura', 'Luo Yi', 'Diggie', 'Faramis', 'Cecilion', 'Valentina', 'Nana', 'Alice', 'Marcel'],
  mid_burst: ['Harley', 'Kadita', 'Selena', 'Julian', 'Aamon', 'Guinevere', 'Joy', 'Lylia'],
  exp_damage: ['Terizla', 'Thamuz', 'X.Borg', 'Dyrroth', 'Yu Zhong', 'Paquito', 'Guinevere', 'Khaleed', 'Martis', 'Aulus', 'Aldous', 'Cici', 'Arlott', 'Lukas', 'Lapu-Lapu', 'Alpha', 'Sun', 'Yin', 'Badang', 'Leomord'],
  exp_tank: ['Uranus', 'Esmeralda', 'Fredrinn', 'Belerick', 'Hilda', 'Barats', 'Ruby', 'Silvanna', 'Masha', 'Freya', 'Roger', 'Bane', 'Gatotkaca', 'Grock']
};

function getArch(hero: string, role: string) {
  if (!hero || !role) return 'default';
  const h = hero.toLowerCase();
  const chk = (arr: string[]) => arr.some(x => x.toLowerCase() === h);
  if (role === 'Roamer') return chk(ARCHETYPES.roamer_damage) ? 'roamer_damage' : 'roamer_support';
  if (role === 'Jungle') return chk(ARCHETYPES.jungle_carry) ? 'jungle_carry' : 'jungle_tank';
  if (role === 'Gold Lane') return 'gold';
  if (role === 'Exp Lane') return chk(ARCHETYPES.exp_damage) ? 'exp_damage' : 'exp_tank';
  if (role === 'Mid Lane') {
    if (chk(ARCHETYPES.mid_damage)) return 'mid_damage';
    if (chk(ARCHETYPES.mid_utility)) return 'mid_utility';
    return 'mid_burst';
  }
  return 'default';
}

function archLabel(arch: string) {
  const m: Record<string, string> = {
    'roamer_support': 'Tank/Support Roamer',
    'roamer_damage': 'Damage Roamer',
    'jungle_carry': 'Carry Jungler',
    'jungle_tank': 'Tank Jungler',
    'gold': 'Gold Laner',
    'exp_damage': 'Damage Fighter',
    'exp_tank': 'Tank Fighter',
    'mid_damage': 'Damage Mage',
    'mid_utility': 'Utility Mage',
    'mid_burst': 'Burst Mage',
    'default': 'Player'
  };
  return m[arch] || arch;
}

function calcScore(pk: any, teamKills: number) {
  const k = pk.kills || 0, d = pk.deaths || 0, a = pk.assists || 0;
  const gold = pk.gold || 0, dmg = pk.damage || 0;
  const kp = teamKills > 0 ? Math.round((k + a) / teamKills * 100) : 0;
  const arch = getArch(pk.hero, pk.role);
  const kda = +(d > 0 ? (k + a) / d : k + a).toFixed(2);
  let score = 0, headline = 'KDA', headVal: any = kda;

  switch (arch) {
    case 'roamer_support':
      score = (a * 3) + (k * 0.5) - (d * 2);
      headline = 'KP%'; headVal = kp + '%'; break;
    case 'roamer_damage':
      score = (k * 2) + (a * 1.5) - (d * 2) + (dmg / 5000);
      headline = 'KP%'; headVal = kp + '%'; break;
    case 'jungle_carry':
      score = (k * 2.5) + (a * 0.8) - (d * 1.5) + (gold / 1500) + (dmg / 4000);
      headline = 'Kills'; headVal = k; break;
    case 'jungle_tank':
      score = (k * 1) + (a * 2) - (d * 1.5) + (dmg / 7000);
      headline = 'KP%'; headVal = kp + '%'; break;
    case 'gold':
      score = (k * 1.5) + (a * 0.5) - (d * 1) + (gold / 1000) + (dmg / 5000);
      headline = 'DMG'; headVal = dmg > 0 ? (dmg / 1000).toFixed(0) + 'K' : '-'; break;
    case 'exp_damage':
      score = (k * 1.5) + (a * 1) - (d * 0.6) + (dmg / 4500);
      headline = 'KDA'; headVal = kda; break;
    case 'exp_tank':
      score = (k * 1) + (a * 1.5) - (d * 0.5) + (dmg / 8000);
      headline = 'KP%'; headVal = kp + '%'; break;
    case 'mid_damage':
      score = (k * 1.5) + (a * 1) - (d * 1.2) + (dmg / 3500);
      headline = 'DMG'; headVal = dmg > 0 ? (dmg / 1000).toFixed(0) + 'K' : '-'; break;
    case 'mid_utility':
      score = (k * 1) + (a * 2) - (d * 1.2) + (dmg / 7000);
      headline = 'KP%'; headVal = kp + '%'; break;
    case 'mid_burst':
      score = (k * 2) + (a * 1.2) - (d * 1.5) + (dmg / 5000);
      headline = 'KDA'; headVal = kda; break;
    default:
      score = kda; headline = 'KDA'; headVal = kda;
  }
  return { score: Math.round(score * 10) / 10, kp, arch, headline, headVal, kda };
}

function scoreClr(v: number) { return v >= 15 ? 'text-mln-green' : v >= 8 ? 'text-white' : 'text-red-400'; }
function kpClr(v: number) { return v >= 70 ? 'text-mln-green' : v >= 50 ? 'text-white' : 'text-gray-500'; }
function kdaClr(v: number) { return v >= 5 ? 'text-mln-green' : v >= 3 ? 'text-white' : 'text-red-400'; }
function wrClr(v: number) { return v >= 60 ? 'text-mln-green' : v <= 40 ? 'text-red-400' : 'text-white'; }

function playerStats(games: any[]) {
  const p: Record<string, any> = {};
  games.forEach(g => {
    const tk1 = (g.picks || []).filter((pk: any) => pk.team === 'team1').reduce((s: number, pk: any) => s + (pk.kills || 0), 0);
    const tk2 = (g.picks || []).filter((pk: any) => pk.team === 'team2').reduce((s: number, pk: any) => s + (pk.kills || 0), 0);
    
    (g.picks || []).forEach((pk: any) => {
      if (!pk.playerUsername) return;
      const tn = pk.team === 'team1' ? g.team1.name : g.team2.name;
      const teamKills = pk.team === 'team1' ? tk1 : tk2;
      const key = pk.playerUsername.toLowerCase() + '|' + (tn || '');
      
      if (!p[key]) {
        p[key] = {
          player: pk.playerUsername,
          team: tn || '',
          role: pk.role || '',
          hero: pk.hero || '',
          g: 0, k: 0, d: 0, a: 0, gold: 0, dmg: 0, w: 0, score: 0, kpTotal: 0, heroes: {}
        };
      }
      p[key].g++;
      p[key].k += pk.kills || 0;
      p[key].d += pk.deaths || 0;
      p[key].a += pk.assists || 0;
      p[key].gold += pk.gold || 0;
      p[key].dmg += pk.damage || 0;
      
      if (pk.team === g.winner) p[key].w++;
      
      if (pk.hero) {
        p[key].heroes[pk.hero] = (p[key].heroes[pk.hero] || 0) + 1;
        if (!p[key].hero) p[key].hero = pk.hero;
      }
      if (!p[key].role && pk.role) p[key].role = pk.role;
      
      const cs = calcScore(pk, teamKills);
      p[key].score += cs.score;
      p[key].kpTotal += cs.kp;
    });
  });
  
  return Object.values(p).map((s: any) => {
    const gamesCount = Math.max(s.g, 1);
    return {
      ...s,
      kda: +(s.d > 0 ? (s.k + s.a) / s.d : s.k + s.a).toFixed(2),
      avgK: +(s.k / gamesCount).toFixed(1),
      avgD: +(s.d / gamesCount).toFixed(1),
      avgA: +(s.a / gamesCount).toFixed(1),
      avgGold: Math.round(s.gold / gamesCount),
      avgDmg: Math.round(s.dmg / gamesCount),
      avgScore: +(s.score / gamesCount).toFixed(1),
      avgKP: Math.round(s.kpTotal / gamesCount),
      wr: Math.round(s.w / gamesCount * 100),
      arch: getArch(s.hero, s.role),
      top: Object.entries(s.heroes).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || ''
    };
  });
}

export default function TournamentTabs({ tournament, games, teams, players = [] }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('avgScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const ps = playerStats(games);
  const filteredPlayers = roleFilter === 'all' ? ps : ps.filter((p: any) => p.role === roleFilter);
  const sortedPlayers = [...filteredPlayers].sort((a: any, b: any) => {
    const v1 = a[sortField];
    const v2 = b[sortField];
    if (sortDir === 'desc') {
      return v2 - v1;
    } else {
      return v1 - v2;
    }
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Best Player per Role for Overview
  const bestPlayers = ROLES.map(role => {
    const list = ps.filter((p: any) => p.role === role);
    const sorted = [...list].sort((a, b) => b.avgScore - a.avgScore);
    return { role, mvp: sorted[0] || null };
  });

  // Calculate leading team
  const leadingTeam = () => {
    const tw: Record<string, number> = {};
    games.forEach((g: any) => {
      const w = g.winner === 'team1' ? g.team1.name : g.winner === 'team2' ? g.team2.name : null;
      if (w) tw[w] = (tw[w] || 0) + 1;
    });
    const sorted = Object.entries(tw).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : '—';
  };

  return (
    <div className="w-full">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border-color mb-8 overflow-x-auto gap-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'leaderboard', label: 'Player Leaderboard' },
          { id: 'matches', label: 'Matches' },
          { id: 'teams', label: 'Teams' },
          { id: 'stats', label: 'Hero Stats' },
          { id: 'bracket', label: 'Bracket' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-bold uppercase tracking-wider text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'text-mln-green border-b-2 border-mln-green bg-surface' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Dynamic Banner */}
            <div className="dash-hero relative overflow-hidden bg-gradient-to-br from-surface to-background border border-border-color p-8 rounded-2xl shadow-lg">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[140px] font-black text-mln-green/5 tracking-widest pointer-events-none select-none">AFL</div>
              <div className="relative z-10">
                <div className="text-xs text-mln-green font-bold uppercase tracking-[4px] mb-2">AFL Nigeria · Official stats</div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-6">{tournament.name}</h2>
                <div className="flex gap-6 md:gap-12 flex-wrap">
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{games.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total Games</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{teams.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Teams</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{ps.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Active Players</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono text-xl md:text-2xl pt-2">{leadingTeam()}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Leader</div></div>
                </div>
              </div>
            </div>

            {/* Role MVPs */}
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Best Player per Role</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {bestPlayers.map(({ role, mvp }) => (
                  <div key={role} className="bg-surface border border-border-color rounded-xl p-4 text-center hover:border-mln-green/40 transition-colors flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="text-[10px] text-mln-green font-bold uppercase tracking-[2px] mb-2">{role}</div>
                      {mvp ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-border-color overflow-hidden shrink-0">
                              <img src={getPlayerImage(mvp.player, players)} alt={mvp.player} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <Link href={`/players/${mvp.player}`} className="text-lg font-black text-white line-clamp-1 leading-none hover:text-mln-green transition-colors">{mvp.player}</Link>
                              {(() => {
                                const teamId = teams.find((t: any) => t.name.toLowerCase() === mvp.team.toLowerCase())?.id;
                                return teamId ? (
                                  <Link href={`/teams/${teamId}`} className="text-[10px] text-gray-400 hover:text-mln-green mt-1 line-clamp-1 font-bold uppercase tracking-widest block">{mvp.team}</Link>
                                ) : (
                                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-1 font-bold uppercase tracking-widest">{mvp.team}</div>
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 text-sm py-4">No data</div>
                      )}
                    </div>
                    {mvp && (
                      <div className="mt-4 pt-4 border-t border-border-color/60">
                        <div className="text-3xl font-black text-mln-green font-mono leading-none">{mvp.avgScore}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Avg Score</div>
                        <div className="text-[10px] text-gray-400 mt-2">{mvp.avgKP}% KP · {mvp.g} GP</div>
                        <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold px-2 py-0.5 rounded mt-2 uppercase">{archLabel(mvp.arch)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matches */}
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Recent Match Log</h3>
              {games.length === 0 ? (
                <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">No games recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {games.slice(0, 5).map((g: any) => (
                    <div key={g.id} className="bg-surface border border-border-color hover:border-mln-green/30 transition-colors rounded-xl overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1 text-center md:text-right">
                        <Link href={`/teams/${g.team1Id}`} className={`font-black text-xl block md:inline hover:text-mln-green transition-colors ${g.winner === 'team1' ? 'text-mln-green' : 'text-white'}`}>{g.team1.name}</Link>
                        {g.winner === 'team1' && <span className="ml-0 md:ml-3 mt-2 md:mt-0 inline-block text-[10px] bg-mln-green text-black px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">WINNER</span>}
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-xs bg-surface-hover border border-border-color/60 px-3 py-1 rounded-full text-yellow-400 font-bold font-mono">Week {g.week} · Game {g.gameNumber}</span>
                        <span className="text-gray-600 text-xs mt-2 uppercase tracking-widest font-bold">VS</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        {g.winner === 'team2' && <span className="mr-0 md:mr-3 mt-2 md:mt-0 inline-block text-[10px] bg-mln-green text-black px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">WINNER</span>}
                        <Link href={`/teams/${g.team2Id}`} className={`font-black text-xl block md:inline hover:text-mln-green transition-colors ${g.winner === 'team2' ? 'text-mln-green' : 'text-white'}`}>{g.team2.name}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLAYER LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Aggregated Player Performance</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {['all', ...ROLES].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border whitespace-nowrap ${
                      roleFilter === r ? 'bg-mln-green text-black border-mln-green' : 'bg-surface text-gray-400 border-border-color hover:text-white'
                    }`}>{r === 'all' ? 'All Roles' : r}</button>
                ))}
              </div>
            </div>

            {sortedPlayers.length === 0 ? (
              <div className="bg-surface border border-border-color rounded-xl p-12 text-center text-gray-500">No players found. Enter games with stats to see them here!</div>
            ) : (
              <div className="bg-surface border border-border-color rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-background text-[11px] uppercase text-white border-b border-border-color">
                      <tr>
                        <th className="px-3 md:px-6 py-4 text-center font-bold">Rank</th>
                        <th className="px-3 md:px-6 py-4 cursor-pointer hover:text-mln-green" onClick={() => toggleSort('player')}>Player {sortField === 'player' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Team</th>
                        <th className="px-4 py-4 hidden md:table-cell">Archetype</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('g')}>GP {sortField === 'g' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('avgScore')}>Score {sortField === 'avgScore' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden sm:table-cell" onClick={() => toggleSort('avgKP')}>KP% {sortField === 'avgKP' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('kda')}>KDA {sortField === 'kda' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center hidden md:table-cell">Avg K/D/A</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden md:table-cell" onClick={() => toggleSort('avgDmg')}>Avg DMG {sortField === 'avgDmg' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden lg:table-cell" onClick={() => toggleSort('avgGold')}>Avg Gold {sortField === 'avgGold' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden sm:table-cell" onClick={() => toggleSort('wr')}>Win Rate {sortField === 'wr' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Top Hero</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/60">
                      {sortedPlayers.map((p: any, i: number) => {
                        const rankBadge = (rank: number) => {
                          if (rank === 1) return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-black">#1</span>;
                          if (rank === 2) return <span className="bg-slate-300/10 text-slate-300 border border-slate-300/30 px-2 py-0.5 rounded text-xs font-black">#2</span>;
                          if (rank === 3) return <span className="bg-amber-600/10 text-amber-500 border border-amber-600/30 px-2 py-0.5 rounded text-xs font-black">#3</span>;
                          return <span className="text-gray-500 font-mono text-xs font-bold">#{rank}</span>;
                        };
                        return (
                          <tr key={p.player + '|' + p.team} className="hover:bg-surface-hover/40 transition-colors">
                            <td className="px-3 md:px-6 py-4 text-center">
                              {rankBadge(i + 1)}
                            </td>
                            <td className="px-3 md:px-6 py-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-border-color overflow-hidden shrink-0 hidden md:block">
                                <img src={getPlayerImage(p.player, players)} alt={p.player} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <Link href={`/players/${p.player}`} className="font-black text-white text-sm md:text-base hover:text-mln-green transition-colors">{p.player}</Link>
                                {(() => {
                                  const teamId = teams.find((t: any) => t.name.toLowerCase() === p.team.toLowerCase())?.id;
                                  return teamId ? (
                                    <Link href={`/teams/${teamId}`} className="block sm:hidden text-[10px] text-gray-500 hover:text-mln-green font-bold mt-0.5">{p.team}</Link>
                                  ) : (
                                    <div className="block sm:hidden text-[10px] text-gray-500 font-bold mt-0.5">{p.team}</div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-300 font-semibold hidden sm:table-cell">
                              {(() => {
                                const teamId = teams.find((t: any) => t.name.toLowerCase() === p.team.toLowerCase())?.id;
                                return teamId ? (
                                  <Link href={`/teams/${teamId}`} className="hover:text-mln-green transition-colors">{p.team}</Link>
                                ) : p.team;
                              })()}
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">{archLabel(p.arch)}</span>
                            </td>
                            <td className="px-2 md:px-6 py-4 text-center font-mono text-xs md:text-sm">{p.g}</td>
                            <td className={`px-2 md:px-6 py-4 text-center font-mono font-black text-sm md:text-base ${scoreClr(p.avgScore)}`}>{p.avgScore}</td>
                            <td className={`px-4 py-4 text-center font-mono font-bold hidden sm:table-cell ${kpClr(p.avgKP)}`}>{p.avgKP}%</td>
                            <td className={`px-2 md:px-6 py-4 text-center font-mono font-bold text-xs md:text-sm ${kdaClr(p.kda)}`}>{p.kda}</td>
                            <td className="px-4 py-4 text-center font-mono text-xs hidden md:table-cell">
                              <span className="text-mln-green font-bold">{p.avgK}</span>
                              <span className="text-gray-600 mx-0.5">/</span>
                              <span className="text-red-400 font-bold">{p.avgD}</span>
                              <span className="text-gray-600 mx-0.5">/</span>
                              <span className="text-cyan-400 font-bold">{p.avgA}</span>
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-yellow-400 font-bold hidden md:table-cell">{p.avgDmg > 0 ? (p.avgDmg / 1000).toFixed(0) + 'K' : '-'}</td>
                            <td className="px-4 py-4 text-center font-mono text-gray-300 hidden lg:table-cell">{p.avgGold > 0 ? p.avgGold.toLocaleString() : '-'}</td>
                            <td className={`px-4 py-4 text-center font-mono font-bold hidden sm:table-cell ${wrClr(p.wr)}`}>{p.wr}%</td>
                            <td className="px-4 py-4 font-semibold text-white hidden sm:table-cell">{p.top}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATCHES LOG TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Game Logs & Picks</h3>
            {games.length === 0 ? (
              <p className="text-gray-400">No games recorded yet.</p>
            ) : (
              games.map((g: any) => {
                const t1Picks = (g.picks || []).filter((p: any) => p.team === 'team1');
                const t2Picks = (g.picks || []).filter((p: any) => p.team === 'team2');
                const t1Bans = (g.bans || []).filter((b: any) => b.team === 'team1');
                const t2Bans = (g.bans || []).filter((b: any) => b.team === 'team2');
                return (
                  <div key={g.id} className="bg-surface border border-border-color hover:border-mln-green/40 transition-colors rounded-xl overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between px-6 py-3 bg-background border-b border-border-color text-xs">
                      <div className="flex gap-3 items-center">
                        <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 px-3 py-1 rounded-lg font-bold uppercase tracking-wider font-mono">Week {g.week}</span>
                        <span className="text-gray-500 font-bold uppercase font-mono">Game {g.gameNumber}</span>
                        {g.date && <span className="text-gray-500 font-mono">{g.date}</span>}
                      </div>
                      <Link href={`/matches/${g.id}`} className="text-xs text-mln-green hover:underline uppercase font-bold tracking-wider font-mono">
                        View Details →
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 items-center p-6 gap-4">
                      <div className="text-center md:text-right">
                        <Link href={`/teams/${g.team1Id}`} className={`text-xl font-black hover:text-mln-green transition-colors ${g.winner === 'team1' ? 'text-mln-green' : 'text-white'}`}>{g.team1.name}</Link>
                        {g.winner === 'team1' && <span className="text-[10px] bg-mln-green/20 text-mln-green border border-mln-green/40 px-2 py-0.5 rounded font-bold mt-2 inline-block">WINNER</span>}
                      </div>
                      <div className="text-center text-gray-600 text-xs font-bold tracking-widest uppercase">VS</div>
                      <div className="text-center md:text-left">
                        <Link href={`/teams/${g.team2Id}`} className={`text-xl font-black hover:text-mln-green transition-colors ${g.winner === 'team2' ? 'text-mln-green' : 'text-white'}`}>{g.team2.name}</Link>
                        {g.winner === 'team2' && <span className="text-[10px] bg-mln-green/20 text-mln-green border border-mln-green/40 px-2 py-0.5 rounded font-bold mt-2 inline-block">WINNER</span>}
                      </div>
                    </div>
                    {(t1Bans.length > 0 || t2Bans.length > 0 || t1Picks.length > 0 || t2Picks.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6 border-t border-border-color/60 pt-4">
                        <div>
                          <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">Bans · {g.team1.name}</div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {t1Bans.map((b: any) => (
                              <div key={b.id} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 pr-2.5 rounded-full text-xs font-semibold overflow-hidden">
                                <img src={getHeroImage(b.hero)} alt={b.hero} className="w-6 h-6 object-cover" />
                                <span>{b.hero}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-mln-green font-bold uppercase tracking-widest mb-2">Picks · {g.team1.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {t1Picks.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-1.5 bg-mln-green/10 border border-mln-green/30 text-mln-green pr-2.5 rounded-full text-xs font-semibold overflow-hidden">
                                <img src={getHeroImage(p.hero)} alt={p.hero} className="w-6 h-6 object-cover" />
                                <span>{p.hero}{p.playerUsername ? ` (${p.playerUsername})` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">Bans · {g.team2.name}</div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {t2Bans.map((b: any) => (
                              <div key={b.id} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 pr-2.5 rounded-full text-xs font-semibold overflow-hidden">
                                <img src={getHeroImage(b.hero)} alt={b.hero} className="w-6 h-6 object-cover" />
                                <span>{b.hero}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-mln-green font-bold uppercase tracking-widest mb-2">Picks · {g.team2.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {t2Picks.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-1.5 bg-mln-green/10 border border-mln-green/30 text-mln-green pr-2.5 rounded-full text-xs font-semibold overflow-hidden">
                                <img src={getHeroImage(p.hero)} alt={p.hero} className="w-6 h-6 object-cover" />
                                <span>{p.hero}{p.playerUsername ? ` (${p.playerUsername})` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PARTICIPATING TEAMS TAB */}
        {activeTab === 'teams' && (
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-mln-green pl-3">Participating Teams ({teams.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {teams.map((team: any) => (
                <Link href={`/teams/${team.id}`} key={team.id} className="bg-surface border border-border-color rounded-xl p-6 text-center hover:border-mln-green/30 hover:scale-[1.02] transition-all duration-300 block">
                  <div className="w-20 h-20 mx-auto bg-background rounded-full border border-border-color flex items-center justify-center mb-4 overflow-hidden relative shadow-inner">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">AFL</span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-white line-clamp-1 hover:text-mln-green transition-colors">{team.name}</h4>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">AFL Nigeria Season</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* HERO STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Hero Pick & Ban Statistics</h3>
            {games.length === 0 ? (
              <p className="text-gray-400">No game data yet.</p>
            ) : (
              <HeroStatsTable games={games} />
            )}
          </div>
        )}

        {/* BRACKET TAB */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Tournament Brackets & Fixtures</h3>
              <a href="https://challonge.com/i8rknz8z" target="_blank" rel="noopener noreferrer" className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block text-center">
                Open Challonge Directly
              </a>
            </div>

            <div className="bg-surface border border-border-color rounded-2xl overflow-hidden shadow-2xl p-2 min-h-[600px] flex flex-col relative">
              {/* Premium Challonge Iframe Embedding */}
              <iframe
                src="https://challonge.com/i8rknz8z/module?theme=1&multiplier=1&match_width_multiplier=1&show_final_results=1&show_standings=1"
                width="100%"
                height="650"
                frameBorder="0"
                scrolling="auto"
                className="w-full rounded-xl bg-background"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroStatsTable({ games }: { games: any[] }) {
  const heroMap: Record<string, { picks: number; bans: number; wins: number }> = {};
  games.forEach((g: any) => {
    (g.bans || []).forEach((b: any) => {
      if (!b.hero) return;
      if (!heroMap[b.hero]) heroMap[b.hero] = { picks: 0, bans: 0, wins: 0 };
      heroMap[b.hero].bans++;
    });
    (g.picks || []).forEach((p: any) => {
      if (!p.hero) return;
      if (!heroMap[p.hero]) heroMap[p.hero] = { picks: 0, bans: 0, wins: 0 };
      heroMap[p.hero].picks++;
      if (p.team === g.winner) heroMap[p.hero].wins++;
    });
  });
  
  const heroes = Object.entries(heroMap).map(([hero, s]) => ({
    hero, ...s,
    wr: s.picks > 0 ? Math.round(s.wins / s.picks * 100) : null,
    presence: Math.round((s.picks + s.bans) / Math.max(games.length, 1) * 100),
  })).sort((a, b) => b.bans - a.bans);

  if (heroes.length === 0) return <p className="text-gray-400">No hero data yet.</p>;

  return (
    <div className="bg-surface border border-border-color rounded-2xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-background text-xs uppercase text-white border-b border-border-color">
            <tr>
              <th className="px-3 md:px-6 py-4">Hero</th>
              <th className="px-2 md:px-6 py-4 text-center">Picks</th>
              <th className="px-2 md:px-6 py-4 text-center">Bans</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell">Wins</th>
              <th className="px-2 md:px-6 py-4 text-center">Win Rate</th>
              <th className="px-4 py-4 text-center hidden md:table-cell">Presence</th>
              <th className="px-4 py-4 hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/60">
            {heroes.map(h => {
              const mb = h.bans >= 3;
              const mp = h.picks >= 3 && h.wr !== null && h.wr >= 60;
              return (
                <tr key={h.hero} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="px-3 md:px-6 py-4 flex items-center gap-3">
                    <img src={getHeroImage(h.hero)} alt={h.hero} className="w-8 h-8 rounded-full border border-border-color object-cover hidden sm:block" />
                    <span className="font-black text-white text-sm md:text-base">{h.hero}</span>
                  </td>
                  <td className="px-2 md:px-6 py-4 text-center text-mln-green font-bold font-mono text-sm md:text-base">{h.picks}</td>
                  <td className="px-2 md:px-6 py-4 text-center text-red-400 font-bold font-mono text-sm md:text-base">{h.bans}</td>
                  <td className="px-4 py-4 text-center font-mono hidden sm:table-cell">{h.wins}</td>
                  <td className={`px-2 md:px-6 py-4 text-center font-mono font-black text-sm md:text-base ${h.wr !== null ? (h.wr >= 60 ? 'text-mln-green' : h.wr <= 40 ? 'text-red-400' : 'text-white') : 'text-gray-500'}`}>
                    {h.wr !== null ? h.wr + '%' : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-20 bg-border-color rounded-full h-2"><div className="bg-mln-green h-2 rounded-full shadow-[0_0_8px_rgba(0,200,83,0.5)]" style={{ width: `${Math.min(h.presence, 100)}%` }}></div></div>
                      <span className="text-xs font-mono font-bold text-gray-300">{h.presence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    {mb && <span className="inline-block bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mr-1">Must Ban</span>}
                    {mp && <span className="inline-block bg-mln-green/10 border border-mln-green/30 text-mln-green text-[10px] font-bold px-2 py-0.5 rounded uppercase">Must Pick</span>}
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
