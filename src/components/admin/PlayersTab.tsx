"use client";

export default function PlayersTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          Player Registrations
        </h3>
      </div>
      <div className="bg-surface border border-border-color rounded-xl p-16 text-center">
        <div className="text-6xl mb-6">🎮</div>
        <h3 className="text-2xl font-bold text-white mb-3">Player Portal Coming Soon</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          The player login and registration portal is currently under construction. Once complete, players will be able to register accounts, create teams, join rosters, and upload their player pictures and logos here.
        </p>
      </div>
    </div>
  );
}
