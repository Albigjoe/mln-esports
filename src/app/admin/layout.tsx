export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-surface min-h-[80vh]">
      <aside className="w-64 border-r border-border-color bg-background p-6 hidden md:block">
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-8 border-b border-border-color pb-4">
          Admin <span className="text-mln-green">Panel</span>
        </h2>
        <nav className="space-y-2">
          <a href="/admin" className="block px-4 py-2 bg-mln-green text-black font-bold uppercase rounded-md tracking-widest text-sm">Tournaments</a>
          <a href="#" className="block px-4 py-2 text-gray-400 hover:text-white font-bold uppercase rounded-md tracking-widest text-sm transition-colors">Teams</a>
          <a href="#" className="block px-4 py-2 text-gray-400 hover:text-white font-bold uppercase rounded-md tracking-widest text-sm transition-colors">Players</a>
          <a href="#" className="block px-4 py-2 text-gray-400 hover:text-white font-bold uppercase rounded-md tracking-widest text-sm transition-colors">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
