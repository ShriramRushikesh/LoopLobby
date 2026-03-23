import React, { useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Loader2 } from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useParams } from 'react-router-dom';
import SongLyrics from './SongLyrics';
import { audioEngine } from './GlobalAudioPlayer';

export default function RoomPlayer({ isHost, compact = false }) {
  const { id: roomId } = useParams();
  const {
    room,
    socket,
    currentSong,
    isPlaying,
    progress,
    isAudible,
    setIsPlaying,
  } = useRoomStore();

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

  const togglePlay = useCallback(() => {
    if (!currentSong || !socket) return;
    const exactTime = audioEngine.getCurrentTime();
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      socket.emit('pause', { roomId, currentTime: exactTime });
    } else {
      audioEngine.play();
      setIsPlaying(true);
      socket.emit('play', { roomId, currentTime: exactTime });
    }
  }, [isPlaying, currentSong, socket, roomId]);

  const playNext = useCallback(() => {
    if (room?.queue?.length > 0 && socket) {
      socket.emit('change-song', { roomId, song: room.queue[0] });
    }
  }, [room?.queue, socket, roomId]);

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

  const displayProgress = seekingRef.current ? seekValueRef.current : progress;
  const pct = duration > 0 ? (displayProgress / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="bg-black/40 rounded-[2rem] border border-white/5 backdrop-blur-3xl p-5 relative overflow-hidden flex flex-col">
        {hasSong && currentSong.thumbnail && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl pointer-events-none"
            style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
          />
        )}
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative group">
            <div className={`absolute -inset-2 bg-pink-500/20 rounded-full blur-xl transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-glow-pulse' : 'opacity-0'}`} />
            <div className={`w-20 h-20 rounded-full bg-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative border border-white/10 p-1 transition-transform duration-700 ${isPlaying ? 'animate-slow-rotate' : ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {hasSong && currentSong.thumbnail ? (
                  <img src={currentSong.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                    <Music className="w-4 h-4 text-white/20" />
                  </div>
                )}
              </div>
              {isPlaying && (
                <div className="absolute inset-0 border-2 border-pink-500/50 rounded-full animate-ping opacity-20" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="h-[38px] flex flex-col justify-center overflow-hidden">
              <h2 className="text-sm font-black text-white leading-tight line-clamp-1 italic tracking-tight uppercase">
                {hasSong ? (currentSong?.title || 'Loading...') : 'Nothing playing'}
              </h2>
              <p className="text-pink-500 font-black uppercase tracking-[0.25em] text-[7px] mt-0.5 line-clamp-1 opacity-80">
                {hasSong ? currentSong?.artist : 'Vibe with LoopLobby'}
              </p>
            </div>
            
            <div className="space-y-1 mt-2">
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden flex items-center">
                <div
                  className="absolute left-0 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  onMouseDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onChange={handleSeekMove}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!hasSong}
                />
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <button onClick={playPrevious} className="text-zinc-500 active:text-white transition" disabled={!hasSong}>
                  <SkipBack className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!hasSong}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-all font-black"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-zinc-500 active:text-white transition" disabled={!hasSong || !room?.queue?.length}>
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 rounded-[2rem] border border-white/10 backdrop-blur-3xl p-6 lg:p-7 relative overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 transition-all duration-500 hover:border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-zinc-900/10 opacity-30" />
      {hasSong && currentSong.thumbnail && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 blur-[60px] pointer-events-none"
          style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
        />
      )}

      <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-center w-full h-full">
        {/* Album Art - Compacted */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative group transition-transform duration-500 hover:scale-[1.02]">
          {hasSong && currentSong.thumbnail ? (
            <img src={currentSong.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-800 to-pink-900 flex items-center justify-center">
              <Music className="w-12 h-12 text-white/30" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 border-4 border-pink-500/30 rounded-3xl heartbeat-pulse pointer-events-none" />
          )}
        </div>

        {/* Track Info & Controls - More compact vertical space */}
        <div className="flex-1 w-full min-w-0 flex flex-col justify-center space-y-4">
          <div className="text-center lg:text-left h-[52px] flex flex-col justify-center overflow-hidden">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-1 uppercase tracking-tight italic">
                {hasSong && !isAudible ? (
                  <div className="flex items-center gap-2 text-pink-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest animate-pulse">Syncing...</span>
                  </div>
                ) : (currentSong?.title || 'Nothing playing')}
              </h2>
            </div>
            <p className="text-pink-500 font-black uppercase tracking-[0.2em] text-[10px] line-clamp-1 opacity-70 mt-0.5">
              {hasSong && !isAudible ? 'Perfecting rhythm' : (currentSong?.artist || 'Search and play a song')}
            </p>
            {room?.queue?.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 opacity-40">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Up Next:</span>
                <span className="text-[8px] font-bold text-zinc-300 truncate max-w-[150px]">{room.queue[0].title}</span>
              </div>
            )}
          </div>

          {/* Progress Bar - Thinner for compact look */}
          <div className="space-y-1.5 w-full">
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden group/progress">
              <div
                className="absolute left-0 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                style={{ width: `${pct}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekMove}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={!hasSong}
              />
            </div>
            <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] font-mono">
              <span>{isAudible ? formatTime(displayProgress) : '0:00'}</span>
              <span>{currentSong?.durationText || formatTime(duration) || '0:00'}</span>
            </div>
          </div>

          {/* Controls - Premium Sizing */}
          <div className="flex items-center justify-center lg:justify-start gap-8 pt-2">
            <button onClick={playPrevious} className="text-zinc-500 hover:text-white transition-all transform hover:scale-125 active:scale-90" disabled={!hasSong}>
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={!hasSong}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(236,72,153,0.4)] transition-all bg-white text-black hover:scale-110 active:scale-95 hover:bg-pink-50 ring-4 ring-white/10"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>
            <button onClick={playNext} className="text-zinc-500 hover:text-white transition-all transform hover:scale-125 active:scale-90" disabled={!hasSong || !room?.queue?.length}>
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
