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
            <Heart className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="text-zinc-400 leading-relaxed">
              LoopLobby was born out of a simple need: to listen to music together, even when miles apart. 
              We believe music is better shared, and our mission is to provide a seamless, high-quality 
              synchronization space for couples and friends worldwide.
            </p>
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
