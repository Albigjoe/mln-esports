"use client";

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'News', href: '/news' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border-color">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img 
                src="/mln-logo.gif" 
                alt="MLN Logo" 
                className="h-12 w-12 rounded-full border-2 border-mln-green object-cover shadow-[0_0_10px_rgba(0,200,83,0.3)]"
              />
              <div className="flex flex-col">
                <span className="font-black text-xl md:text-2xl tracking-widest text-white uppercase leading-tight">
                  MLN
                </span>
                <span className="text-[9px] md:text-[10px] text-mln-green font-bold tracking-[3px] uppercase leading-tight">
                  Mobile Legends Nigeria
                </span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-mln-green transition-colors px-3 py-2 rounded-md text-sm font-semibold tracking-wide uppercase"
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                href="/admin"
                className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-md text-sm font-bold tracking-wide uppercase transition-colors"
              >
                Admin Panel
              </Link>
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white hover:bg-surface-hover p-2 rounded-md transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border-color">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-mln-green block px-3 py-2 rounded-md text-base font-medium tracking-wide uppercase"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/admin"
              className="block w-full text-center mt-4 bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-md text-base font-bold tracking-wide uppercase transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Admin Panel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
