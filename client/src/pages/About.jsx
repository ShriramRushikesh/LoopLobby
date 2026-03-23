import React from 'react';
import { Music, Heart, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20 mb-4 animate-pulse">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            About LoopLobby
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Keeping music social, synchronized, and free forever.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-pink-500/50 transition-colors">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4">
                <span className="text-sm">🇮🇳</span>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Made in India | Solapur Pride</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">Our Mission</h1>
              <p className="text-zinc-400 text-lg leading-relaxed">
                LoopLobby was born in Solapur, India, with a single goal: to bridge the gap between people through the universal language of music. 
                Built with the spirit of Digital India, we provide a seamless, synchronized audio experience that brings friends and families closer, no matter the distance.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-colors">
            <Users className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Built for You</h3>
            <p className="text-zinc-400 leading-relaxed">
              Designed and built in India, LoopLobby is a community-driven project. We focus on 
              minimalism, privacy, and visual excellence to give you the most premium experience possible.
            </p>
          </div>
        </section>

        <section className="p-8 rounded-3xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-white/10 backdrop-blur-xl text-center">
          <Shield className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Free. Forever.</h3>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-8 text-lg">
            We don't believe in subscriptions or paywalls for social connection. LoopLobby is funded 
            by non-intrusive advertisements to keep the lights on while remaining 100% free for everyone.
          </p>
          <Link 
            to="/" 
            className="inline-block px-8 py-4 rounded-2xl bg-white text-black font-bold hover:scale-105 transition-transform"
          >
            Start Vibing
          </Link>
        </section>

        <footer className="text-center pt-12 border-t border-white/5">
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} LoopLobby. Built with ❤️ in India.
          </p>
        </footer>
      </div>
    </div>
  );
}
