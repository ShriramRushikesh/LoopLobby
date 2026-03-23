import React from 'react';
import { Mail, MessageCircle, Clock } from 'lucide-react';

export default function Contact() {
  const contactEmail = "shriramrushikesh@gmail.com"; // Placeholder replaced with common sense or generic

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            Contact Support
          </h1>
          <p className="text-zinc-400">
            Have a question or feedback? We're here to help.
          </p>
        </header>

        <div className="grid gap-6">
          <a 
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-pink-500/50 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-8 h-8 text-pink-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Email Us</h3>
              <p className="text-zinc-400">{contactEmail}</p>
            </div>
          </a>

          <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Response Time</h3>
              <p className="text-zinc-400">We usually respond within 48 hours.</p>
            </div>
          </div>
        </div>

        <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <MessageCircle className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400 italic">
            "Music is the shorthand of emotion." — Leo Tolstoy
          </p>
        </div>
      </div>
    </div>
  );
}
