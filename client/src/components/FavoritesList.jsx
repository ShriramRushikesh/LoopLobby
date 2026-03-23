import React, { memo } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { Heart, Play, Music } from 'lucide-react';

function FavoritesList() {
  const { room, socket, id: roomId } = useRoomStore();

  const playSong = (song) => {
    socket?.emit('change-song', { roomId, song });
  };

  if (!room?.favorites || room.favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 border border-pink-500/20">
          <Heart className="w-6 h-6 text-pink-500/40" />
        </div>
        <p className="text-zinc-500 font-bold tracking-tight text-xs uppercase">No favorites yet.</p>
        <p className="text-zinc-600 text-[10px] mt-1">Heart a song to save it for later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      <div className="px-2 pb-2 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-pink-500/60">Your Favorites ({room.favorites.length})</span>
      </div>
      {room.favorites.map((song, i) => (
        <div 
          key={i} 
          className="group flex items-center gap-3 p-2 rounded-2xl bg-pink-500/5 border border-pink-500/10 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all cursor-pointer"
          onClick={() => playSong(song)}
        >
          <div className="relative w-11 h-11 shrink-0">
            <img src={song.thumbnail} className="w-full h-full rounded-xl object-cover shadow-lg border border-white/5" alt={song.title} />
            <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{song.title}</p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest opacity-60 truncate">{song.artist}</p>
          </div>
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-current mr-2" />
        </div>
      ))}
    </div>
  );
}

export default memo(FavoritesList);
