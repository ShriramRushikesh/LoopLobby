import React, { useState, memo } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { Heart, Send, Sparkles, Moon, Sun, Flame, Stars, Gift, Clock, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const COMPLIMENTS_DB = [
  "You have the absolute best taste in music! 🎵",
  "Just thinking about how awesome you are... ❤️",
  "You always know how to set the perfect vibe ✨",
  "I love exploring new songs with you! 🎧",
  "Your playlist is as beautiful as you are 🌹",
  "Vibing with you is my favorite thing to do 🎶",
  "Your energy makes every song sound better 💫",
  "I could listen to music with you all day 🕰️",
  "You're the rhythm to my melody 🎹",
  "Every track is a memory when I'm with you 📸",
  "I'm totally addicted to our music sessions 🎶",
  "You have a heart of gold and a playlist to match 🏆",
  "You make this room glow! ✨",
  "Our musical chemistry is unmatched 🔬",
  "Listening with you is pure magic 🪄"
];

function CoupleFeatures({ username }) {
  const { socket, room, moodMode } = useRoomStore();
  const [noteMsg, setNoteMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]);

  const generateCompliment = async () => {
    setIsGenerating(true);
    
    // Logic to never repeat until exhausted
    let availableIndices = COMPLIMENTS_DB.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0) {
      // Reset if all are used
      availableIndices = COMPLIMENTS_DB.map((_, i) => i);
      setUsedIndices([]);
    }
    
    // Pick random un-used
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const randomComp = COMPLIMENTS_DB[randomIndex];
    
    setUsedIndices(prev => [...prev, randomIndex]);
    
    setTimeout(() => {
      console.log('[LoopLobby] Sending love note:', randomComp);
      socket.emit('send_love_note', { id: Date.now(), message: randomComp });
      setIsGenerating(false);
    }, 800);
  };

  const moods = [
    { id: 'normal', icon: Sun, label: 'Normal' },
    { id: 'candlelight', icon: Flame, label: 'Candlelight' },
    { id: 'sunset', icon: Moon, label: 'Sunset' },
    { id: 'stars', icon: Stars, label: 'Night Sky' }
  ];

  const sendNote = (e) => {
    e.preventDefault();
    if (!noteMsg.trim()) return;
    socket.emit('send_love_note', { id: Date.now(), message: noteMsg });
    setNoteMsg('');
  };

  const sendGift = (type) => {
    socket.emit('send_emoji', { id: Date.now(), emoji: type === 'rose' ? '🌹' : '💝', x: Math.random() * 80 + 10 });
    socket.emit('send_message', { text: `Sent a ${type}!`, isBlurred: false });
  };

  const saveMoment = () => {
    const song = room?.currentSong || { name: 'Current Vibe', artist: 'Unknown' };
    socket.emit('save_moment', { id: Date.now(), ...song });
  };

  return (
    <div className="bg-black/20 rounded-3xl border border-pink-500/10 backdrop-blur-md p-4 overflow-hidden relative shadow-inner">
      <div className="absolute top-0 right-0 p-2 opacity-30 pointer-events-none"><Heart className="w-24 h-24 text-pink-500 blur-2xl" /></div>
      
      <h2 className="text-[10px] sm:text-xs font-black flex items-center gap-2 mb-4 text-pink-300 relative z-10 uppercase tracking-widest">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Extras
      </h2>

      <div className="space-y-6 relative z-10">
        
        {/* Unified Tool Stack */}
        <div className="space-y-6">
          {/* Mood Lighting */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Atmosphere Control</label>
            <div className="flex flex-wrap gap-2">
              {moods.map(m => {
                const Icon = m.icon;
                const isActive = moodMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => socket.emit('change_mood', m.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black ${isActive ? 'bg-pink-500 text-white border-pink-400 shadow-xl shadow-pink-500/30 ring-2 ring-pink-500/20' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Love Notes & Actions */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Send Expressions</label>
            <form onSubmit={sendNote} className="flex gap-2">
              <input
                type="text"
                value={noteMsg}
                onChange={(e) => setNoteMsg(e.target.value)}
                placeholder="Whisper a note..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500/50 text-white placeholder-zinc-800 transition-all shadow-inner"
              />
              <button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white px-4 rounded-xl transition shadow-lg shadow-pink-500/20 active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Rapid Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={generateCompliment} disabled={isGenerating} className="flex flex-col items-center justify-center gap-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 p-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-purple-900/20">
              {isGenerating ? <div className="animate-spin text-white">⏳</div> : <Sparkles className="w-5 h-5 text-purple-400" />} 
              <span>Compliment</span>
            </button>
            <button onClick={() => sendGift('heart')} className="flex flex-col items-center justify-center gap-2 bg-pink-900/40 hover:bg-pink-800/60 border border-pink-500/30 text-pink-200 p-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-900/20">
              <Gift className="w-5 h-5 text-pink-400" /> <span>Hug</span>
            </button>
            <button onClick={saveMoment} className="flex flex-col items-center justify-center gap-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 p-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">
              <Clock className="w-5 h-5 text-blue-400" /> <span>Moment</span>
            </button>
          </div>
        </div>
        
        {/* Stats - Unified footer */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-2xl border border-white/5">
           <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-pink-400 leading-none">{room?.stats?.songsListened || 0}</span>
               <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter mt-0.5">Vibes</span>
             </div>
             <div className="w-px h-5 bg-white/10"></div>
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-purple-400 leading-none">0m</span>
               <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter mt-0.5">Sync</span>
             </div>
           </div>
           
           <div className="flex -space-x-1.5">
             {room?.users.slice(0, 3).map((u, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border border-zinc-900 flex items-center justify-center text-[8px] font-black shadow-lg uppercase">
                   {u.username.substring(0,1)}
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CoupleFeatures);
