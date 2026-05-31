"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function PlayersGrid({ initialPlayers }: { initialPlayers: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = initialPlayers.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.realName && p.realName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.team?.name && p.team.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-8 max-w-md mx-auto">
        <input 
          type="text" 
          placeholder="Search by username, real name, or team..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border-color rounded-xl px-4 py-3 text-white outline-none focus:border-mln-green transition-colors text-center"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {filteredPlayers.map(player => (
          <Link 
            key={player.id} 
            href={`/players/${encodeURIComponent(player.username)}`}
            className="bg-surface border border-border-color hover:border-mln-green rounded-xl overflow-hidden group transition-all"
          >
            <div className="aspect-square bg-surface-hover relative overflow-hidden">
              {player.pictureUrl ? (
                <img src={player.pictureUrl} alt={player.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-700 bg-gradient-to-br from-surface to-background">
                  {player.username.substring(0,2).toUpperCase()}
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {player.team ? (
                  <span className="bg-mln-green text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow">
                    {player.team.name}
                  </span>
                ) : (
                  <span className="bg-gray-700 text-gray-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow">
                    Free Agent
                  </span>
                )}
                <span className="bg-background/80 backdrop-blur text-white border border-white/10 text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow">
                  {player.role || 'Player'}
                </span>
              </div>
            </div>
            <div className="p-3 md:p-4 text-center">
              <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-wider truncate">
                {player.username}
              </h3>
              {player.realName && !player.realName.startsWith('admin:') && (
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mt-1">
                  {player.realName}
                </p>
              )}
              {player.gameId && (
                <p className="text-[9px] text-mln-green font-black uppercase tracking-widest mt-1">
                  ✓ Verified
                </p>
              )}
            </div>
          </Link>
        ))}
        {filteredPlayers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 font-bold uppercase tracking-widest">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}
