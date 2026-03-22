import React, { useRef, useCallback, memo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useParams } from 'react-router-dom';
import SongLyrics from './SongLyrics';
import { audioEngine } from './GlobalAudioPlayer';
import { motion } from 'framer-motion';

const RoomPlayer = ({ isHost }) => {
  const { id: roomId } = useParams();
  
  // Zustand selectors for targeted re-renders
  const socket = useRoomStore(s => s.socket);
  const currentSong = useRoomStore(s => s.currentSong);
  const isPlaying = useRoomStore(s => s.isPlaying);
  const setIsPlaying = useRoomStore(s => s.setIsPlaying);
  const progress = useRoomStore(s => s.progress);
  const queue = useRoomStore(s => s.queue);

  const hasSong = !!currentSong;
  const duration = currentSong?.durationMs ? currentSong.durationMs / 1000 : 0;

  // ── Seek: only emit on mouse/touch release, not every pixel drag ──────────
  const seekingRef = useRef(false);
  const seekValueRef = useRef(0);

  const handleSeekStart = () => { seekingRef.current = true; };
  const handleSeekMove = (e) => { seekValueRef.current = parseFloat(e.target.value); };
  const handleSeekEnd = useCallback(() => {
    if (!seekingRef.current || !socket || !roomId) return;
    seekingRef.current = false;
    const t = seekValueRef.current;
    audioEngine.seek(t);  // immediate local response
    socket.emit('seek', { roomId, currentTime: t });
  }, [socket, roomId]);

  // ── Play/Pause — audioEngine called IMMEDIATELY inside gesture for mobile ──
  const togglePlay = useCallback(() => {
    if (!currentSong || !socket) return;
    if (isPlaying) {
      audioEngine.pause();       // INSIDE gesture — mobile allows this
      setIsPlaying(false);
      socket.emit('pause', { roomId, currentTime: progress });
    } else {
      audioEngine.play();        // INSIDE gesture — mobile allows this
      setIsPlaying(true);
      socket.emit('play', { roomId, currentTime: progress });
    }
  }, [isPlaying, currentSong, socket, roomId, progress, setIsPlaying]);

  const playNext = useCallback(() => {
    if (queue?.length > 0 && socket) {
      socket.emit('change-song', { roomId, song: queue[0] });
    }
  }, [queue, socket, roomId]);

  const playPrevious = useCallback(() => {
    if (socket) {
      audioEngine.seek(0);
      socket.emit('seek', { roomId, currentTime: 0 });
    }
  }, [socket, roomId]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage — use local seekValueRef while dragging for smooth UX
  const displayProgress = seekingRef.current ? seekValueRef.current : progress;
  const pct = duration > 0 ? (displayProgress / duration) * 100 : 0;

  return (
    <div className="bg-black/40 rounded-[2rem] border border-white/10 backdrop-blur-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col shadow-2xl">
      {/* Background blur of album art */}
      {hasSong && currentSong.thumbnail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          className="absolute inset-0 bg-cover bg-center blur-3xl pointer-events-none scale-110"
          style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start w-full">
        {/* Album Art */}
        <motion.div 
          layoutId="album-art"
          className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-3xl bg-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative group"
        >
          {hasSong && currentSong.thumbnail ? (
            <img src={currentSong.thumbnail} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-800/50 to-pink-900/50 flex items-center justify-center">
              <Music className="w-20 h-20 text-white/20" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 border-[3px] border-pink-500/40 rounded-3xl heartbeat-pulse pointer-events-none" />
          )}
        </motion.div>

        {/* Track Info & Controls */}
        <div className="flex-1 w-full space-y-4 sm:space-y-6 flex flex-col justify-center">
          <div className="text-center md:text-left">
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              key={currentSong?.title}
              className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 md:mb-2 leading-tight line-clamp-2 drop-shadow-lg"
            >
              {currentSong?.title || 'Ready to Vibe?'}
            </motion.h2>
            <p className="text-pink-400/80 text-sm sm:text-lg font-medium line-clamp-1 tracking-wide">
              {currentSong?.artist || 'Search for your favorite track'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div 
              id="seek-track"
              className="relative h-3 w-full bg-white/5 rounded-full flex items-center group/seek touch-none select-none"
              onPointerDown={(e) => {
                if (!hasSong) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const seekTo = ((e.clientX - rect.left) / rect.width) * duration;
                seekValueRef.current = Math.min(Math.max(0, seekTo), duration);
                handleSeekStart();
                handleSeekEnd(); // trigger immediate seek on click
              }}
            >
              {/* Track Background */}
              <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Draggable Thumb (Point) */}
              <motion.div
                className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-pink-500 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                style={{ left: `calc(${pct}% - 10px)` }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Constraints are tricky with relative %, we handle logic in onDrag
                dragElastic={0}
                dragMomentum={false}
                onDragStart={handleSeekStart}
                onDrag={(e, info) => {
                  const track = document.getElementById('seek-track');
                  if (!track) return;
                  const rect = track.getBoundingClientRect();
                  const newX = Math.min(Math.max(0, info.point.x - rect.left), rect.width);
                  const seekTo = (newX / rect.width) * duration;
                  seekValueRef.current = seekTo;
                  handleSeekMove({ target: { value: seekTo } });
                }}
                onDragEnd={handleSeekEnd}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9, boxShadow: '0 0 20px rgba(236,72,153,0.8)' }}
              >
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
              </motion.div>

              {/* Invisible touch expander */}
              <div className="absolute inset-x-0 -inset-y-3 z-10 cursor-pointer" />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-zinc-500 tracking-tighter">
              <span className="bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{formatTime(displayProgress)}</span>
              <span className="bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{currentSong?.durationText || formatTime(duration) || '0:00'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center md:justify-start gap-5 sm:gap-8 mt-2 md:mt-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playPrevious}
              className="text-zinc-400 hover:text-white transition-colors"
              disabled={!hasSong}
            >
              <SkipBack className={`w-7 h-7 sm:w-8 sm:h-8 fill-current ${!hasSong && 'opacity-30'}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, shadow: '0 0 20px rgba(236,72,153,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              disabled={!hasSong}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
                hasSong
                  ? 'bg-white text-black border-transparent'
                  : 'bg-white/5 text-white/20 border-white/10'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playNext}
              className="text-zinc-400 hover:text-white transition-colors"
              disabled={!hasSong || !queue?.length}
            >
              <SkipForward className={`w-7 h-7 sm:w-8 sm:h-8 fill-current ${(!hasSong || !queue?.length) && 'opacity-30'}`} />
            </motion.button>

            {/* Recovery Controls */}
            <div className="ml-auto flex items-center gap-2">
              {hasSong && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => audioEngine.loadSong(currentSong.videoId || currentSong.id, progress)}
                  className="p-2 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-colors"
                  title="Refresh Song"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </motion.button>
              )}
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { audioEngine.unmute(); audioEngine.play(); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-[10px] font-black tracking-tighter uppercase"
              >
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                <span>Fix Audio</span>
              </motion.button>
              
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-zinc-500/10 border border-zinc-500/20 rounded-full text-zinc-400 text-[10px] font-black tracking-[0.2em] uppercase">
                <span>Crystal Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentSong && <SongLyrics currentSong={currentSong} />}
    </div>
  );
};

export default memo(RoomPlayer);
