import React, { memo } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { History, Play, Music } from 'lucide-react';

function HistoryList() {
  const { recentlyPlayed, socket, room } = useRoomStore();
  const roomId = room?.roomId;

  const playSong = (song) => {
    socket?.emit('change-song', { roomId, song });
  };

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <History className="w-6 h-6 text-zinc-600" />
        </div>
        <p className="text-zinc-500 font-bold tracking-tight text-xs uppercase">No history yet.</p>
        <p className="text-zinc-600 text-[10px] mt-1 mb-6">Play some songs to see them here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      <div className="px-2 pb-2 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Recently Played ({recentlyPlayed.length})</span>
      </div>
      {recentlyPlayed.map((song, i) => (
        <div 
          key={`${song.videoId || song.id}-${i}`} 
          className="group flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-pink-500/30 transition-all cursor-pointer"
          onClick={() => playSong(song)}
        >
          <div className="relative w-11 h-11 shrink-0">
            <img src={song.thumbnail} className="w-full h-full rounded-xl object-cover shadow-lg" alt={song.title} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{song.title}</p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest opacity-60 truncate">{song.artist}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(HistoryList);
