import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border-color mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/mln-logo.gif" 
                alt="MLN Logo" 
                className="h-10 w-10 rounded-full border border-mln-green object-cover shadow-[0_0_8px_rgba(0,200,83,0.2)]"
              />
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-widest text-white uppercase leading-tight">
                  MLN
                </span>
                <span className="text-[9px] text-mln-green font-bold tracking-[2px] uppercase leading-tight">
                  Mobile Legends Nigeria
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              The premier destination for Mobile Legends: Bang Bang tournaments and esports in Nigeria.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase mb-4 text-sm">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/tournaments" className="text-gray-400 hover:text-mln-green transition-colors text-sm">Tournaments</Link></li>
              <li><Link href="/news" className="text-gray-400 hover:text-mln-green transition-colors text-sm">News & Updates</Link></li>
              <li><Link href="/#about" className="text-gray-400 hover:text-mln-green transition-colors text-sm">About Us</Link></li>
              <li><Link href="/admin" className="text-gray-400 hover:text-mln-green transition-colors text-sm">Staff Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase mb-4 text-sm">Connect With Us</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {/* WhatsApp */}
              <a 
                href="https://chat.whatsapp.com/GhKTLHRT55XDPGHuOtK64N" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-background border border-border-color flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300"
                title="WhatsApp Group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.485.002 9.948-4.463 9.95-9.952.002-2.659-1.026-5.158-2.897-7.03C16.556 1.75 14.06 .72 11.4 0.72 5.918.72 1.456 5.18 1.454 10.66c-.001 1.636.433 3.23 1.258 4.654L1.72 20.283l5.044-1.323zM17.067 14c-.276-.139-1.636-.807-1.89-.899-.253-.092-.437-.139-.621.139-.184.277-.713.899-.874 1.084-.161.184-.322.207-.598.069-.276-.139-1.168-.43-2.223-1.373-.822-.733-1.377-1.639-1.538-1.916-.161-.276-.017-.426.121-.564.124-.124.276-.322.414-.484.138-.161.184-.276.276-.461.092-.184.046-.346-.023-.484-.069-.138-.621-1.498-.851-2.052-.224-.539-.452-.465-.621-.474-.16-.008-.344-.01-.528-.01-.184 0-.483.069-.736.346-.253.276-.966.945-.966 2.304 0 1.359.988 2.673 1.127 2.857.139.184 1.944 2.969 4.71 4.159.658.283 1.173.452 1.574.58.66.21 1.261.18 1.736.109.528-.079 1.636-.669 1.866-1.315.23-.647.23-1.2.161-1.314-.069-.115-.253-.184-.528-.322z"/>
                </svg>
              </a>
              {/* Discord */}
              <a 
                href="https://discord.gg/2eXGWATF8" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-background border border-border-color flex items-center justify-center text-gray-400 hover:text-indigo-400 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(129,140,248,0.3)] transition-all duration-300"
                title="Discord Server"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.88,6.83,77.19,77.19,0,0,0,49.58,0,105.15,105.15,0,0,0,19.14,8.07C2.81,32.22-1.71,55.77.47,78.89a107.4,107.4,0,0,0,32.44,16.29,80.7,80.7,0,0,0,6.83-11.06,72.65,72.65,0,0,1-10.75-5.14c.91-.66,1.8-1.34,2.65-2a76.93,76.93,0,0,0,71.06,0c.85.7,1.74,1.38,2.65,2a72.65,72.65,0,0,1-10.75,5.14,80.7,80.7,0,0,0,6.83,11.06,107.4,107.4,0,0,0,32.44-16.29C129.66,48.5,124.23,25.26,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/mobile_legends_nigeria?igsh=MXNuNHpwNWk0Zjk3eQ==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-background border border-border-color flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-300"
                title="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a 
                href="https://www.youtube.com/@Mobilelegendsnigeria" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-background border border-border-color flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300"
                title="YouTube Channel"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.972 24 12 24 12s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border-color mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Mobile Legends Nigeria. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            Not affiliated with Moonton.
          </p>
        </div>
      </div>
    </footer>
  );
}
