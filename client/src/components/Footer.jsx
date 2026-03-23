import React from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-black/40 border-t border-white/5 backdrop-blur-xl py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
              LoopLobby
            </span>
          </Link>
          <p className="text-zinc-500 text-xs text-center md:text-left max-w-xs leading-relaxed">
            LoopLobby does not host or own any music content. All playback is user-initiated via third-party platforms.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link to="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">About</Link>
          <Link to="/contact" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Contact</Link>
          <Link to="/privacy" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Terms</Link>
        </nav>

        <div className="flex flex-col items-center md:items-end gap-2 text-zinc-500 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            <span className="text-base">🇮🇳</span>
            <div className="flex flex-col items-start leading-none gap-1">
              <span>Made in Solapur, India</span>
              <span className="text-[8px] opacity-40">Digital India Initiative</span>
            </div>
          </div>
          <p className="opacity-50 mt-1">&copy; {new Date().getFullYear()} LoopLobby</p>
        </div>
      </div>
    </footer>
  );
}
