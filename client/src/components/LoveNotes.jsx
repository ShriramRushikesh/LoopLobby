import React, { useEffect } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoveNotes() {
  const { loveNotes, emojis, removeLoveNote, removeEmoji } = useRoomStore();

  useEffect(() => {
    const intervals = emojis.map(emoji => {
      return setTimeout(() => removeEmoji(emoji.id), 4000);
    });
    return () => intervals.forEach(clearTimeout);
  }, [emojis, removeEmoji]);
  
  useEffect(() => {
    const intervals = loveNotes.map(note => {
      return setTimeout(() => removeLoveNote(note.id), 3500);
    });
    return () => intervals.forEach(clearTimeout);
  }, [loveNotes, removeLoveNote]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <AnimatePresence>
        {/* Floating Emojis */}
        {emojis.map((em) => (
          <motion.div
            key={em.id}
            initial={{ y: '100vh', opacity: 0, x: `${em.x}vw`, scale: 0.5 }}
            animate={{ y: '-20vh', opacity: [0, 1, 1, 0], x: `${em.x + (Math.random() * 10 - 5)}vw`, scale: Math.random() * 1 + 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute text-4xl filter drop-shadow-lg"
          >
            {em.emoji}
          </motion.div>
        ))}

        {/* Love Notes with Heart-Break Animation */}
        {loveNotes.map((note) => (
          <div key={note.id} className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* The Breaking Heart Stage */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, times: [0, 0.7, 1] }}
              className="absolute z-[201]"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: ["drop-shadow(0 0 10px rgba(244,63,94,0.4))", "drop-shadow(0 0 30px rgba(244,63,94,0.8))", "drop-shadow(0 0 10px rgba(244,63,94,0.4))"]
                }}
                transition={{ repeat: 2, duration: 0.4 }}
              >
                <div className="relative">
                  {/* Heart Particles on break */}
                  <AnimatePresence>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`p-${i}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0.5],
                          x: (Math.random() - 0.5) * 200,
                          y: (Math.random() - 0.5) * 200,
                          rotate: Math.random() * 360
                        }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="absolute text-2xl"
                      >
                        💖
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Left Half */}
                  <motion.div 
                    animate={{ x: [0, -40], y: [0, 20], rotate: [0, -45], opacity: [1, 1, 0] }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute inset-0 text-8xl md:text-9xl pointer-events-none"
                  >
                    ❤️
                  </motion.div>
                  {/* Right Half */}
                  <motion.div 
                    animate={{ x: [0, 40], y: [0, 20], rotate: [0, 45], opacity: [1, 1, 0] }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="text-8xl md:text-9xl pointer-events-none"
                  >
                    ❤️
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* The Message Box Stage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100, rotateY: 90 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0, 
                rotateY: 0,
                perspective: 1000 
              }}
              exit={{ opacity: 0, scale: 0.3, y: -100, rotate: 20 }}
              transition={{ delay: 1.4, duration: 0.8, type: 'spring', damping: 12 }}
              className="relative p-1.5 bg-gradient-to-br from-white via-pink-100 to-rose-200 rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(244,63,94,0.4),inset_0_-8px_16px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)] max-w-[340px] w-[90%]"
            >
              <div className="bg-white/80 backdrop-blur-2xl rounded-[2.8rem] p-8 text-center border border-white relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl" />
                
                <div className="flex flex-col items-center gap-4 mb-5 relative z-10">
                  {/* 3D-ish Teddy Container */}
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-20 h-20 bg-gradient-to-br from-pink-50 via-white to-rose-100 rounded-3xl flex items-center justify-center text-4xl shadow-[0_10px_20px_-5px_rgba(244,63,94,0.2)] border-2 border-white"
                  >
                    🧸
                  </motion.div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/50">Heart-to-Heart</p>
                    <h4 className="text-sm font-bold text-zinc-800 bg-white/50 px-4 py-1.5 rounded-full border border-pink-100/50 shadow-sm backdrop-blur-md">
                      {note.sender}
                    </h4>
                  </div>
                </div>

                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    <p className="text-zinc-800 font-extrabold text-2xl leading-tight px-2 break-words">
                      "{note.message}"
                    </p>
                  </motion.div>
                </div>
                
                <div className="mt-6 flex justify-center gap-1.5 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        scale: [1, 1.4, 1],
                        y: [0, -5, 0],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ repeat: Infinity, delay: i * 0.15, duration: 1.5 }}
                      className="text-pink-400 text-sm"
                    >
                      ✨
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
