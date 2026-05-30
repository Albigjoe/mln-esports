"use client";

import Link from 'next/link';
import { Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const showAdmin = session?.user && (
    (session.user as any).role === 'staff' || 
    (session.user as any).role === 'admin'
  );

  useEffect(() => {
    // Silently pre-warm the Render backend so it never sleeps on first user visit
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mln-backend-api.onrender.com';
    fetch(`${backendUrl}/status`).catch(() => {});
  }, []);

  const navLinks = [
    { name: 'Home',        href: '/' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Players',     href: '/players' },
    { name: 'Register',    href: '/register-team' },
    { name: 'Heroes',      href: '/heroes' },
    { name: 'News',        href: '/news' },
    { name: 'About',       href: '/#about' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border-color">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
            <img
              src="/mln-logo.gif"
              alt="MLN Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-mln-green object-cover shadow-[0_0_10px_rgba(0,200,83,0.3)]"
            />
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-2xl tracking-widest text-white uppercase leading-tight">MLN</span>
              <span className="text-[8px] sm:text-[10px] text-mln-green font-bold tracking-[3px] uppercase leading-tight">Mobile Legends Nigeria</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-mln-green transition-colors px-3 py-2 rounded-md text-sm font-semibold tracking-wide uppercase"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 border-l border-border-color pl-4 ml-2">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-gray-400 hover:text-mln-green border border-border-color hover:border-mln-green/50 px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all"
              >
                <User size={14} /> Profile
              </Link>
              {showAdmin && (
                <Link
                  href="/admin"
                  className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-md text-sm font-bold tracking-wide uppercase transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white hover:bg-surface-hover p-2 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border-color">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-mln-green block px-3 py-3 rounded-md text-base font-medium tracking-wide uppercase border-b border-border-color/40 last:border-0"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/profile"
              className="flex items-center gap-2 text-gray-300 hover:text-mln-green px-3 py-3 rounded-md text-base font-medium tracking-wide uppercase"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} /> Profile
            </Link>
            {showAdmin && (
              <Link
                href="/admin"
                className="block w-full text-center mt-2 bg-mln-green hover:bg-mln-green-dark text-black px-4 py-3 rounded-md text-base font-bold tracking-wide uppercase transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
