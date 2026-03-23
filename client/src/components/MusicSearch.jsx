import React, { useState, useEffect, memo } from 'react';
import { Search, Play, Plus, Heart, Music, ListMusic, Loader2, X, History } from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useQuery } from '@tanstack/react-query';

const SongItem = memo(({ song, isQueue, onPlay, onAdd, onToggleFav, isFav, isRecent }) => (
  <div 
    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group transition-colors cursor-pointer"
    onClick={() => onPlay(song)}
  >
    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
      <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-5 h-5 text-white fill-current" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <h4 className="text-sm font-medium text-white truncate">{song.title}</h4>
        {isRecent && <span className="text-[7px] bg-white/10 text-zinc-400 px-1 py-0.5 rounded font-black uppercase tracking-widest">Recent</span>}
      </div>
      <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFav(song); }} 
        className="text-zinc-400 hover:text-pink-400 p-1"
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-400 text-pink-400' : ''}`} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(song); }} 
        className="text-zinc-400 hover:text-white p-1"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
));

const MusicSearch = () => {
  const room = useRoomStore(s => s.room);
  const socket = useRoomStore(s => s.socket);
  const recentlyPlayed = useRoomStore(s => s.recentlyPlayed);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(query.trim());
    }, 400); // Fast 400ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading: loading } = useQuery({
    queryKey: ['music-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/music/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    },
    enabled: !!searchTerm,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  const playSong = (song) => {
    const roomId = room?.roomId;
    if (!roomId || !socket) return;
    socket.emit('change-song', { roomId, song });
  };

  const addToQueue = (song) => {
    if (!room?.roomId || !socket) return;
    socket.emit('add_to_queue', song);
  };

  const toggleFavorite = (song) => {
    const roomId = room?.roomId;
    if (!roomId || !socket) return;
    socket.emit('toggle_favorite', { roomId, song });
  };

  const isFavorite = (videoId) => {
    return room?.favorites?.some(s => s.videoId === videoId);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="space-y-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = query.trim();
            if (trimmed) setSearchTerm(trimmed);
          }} 
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs..." 
            className="w-full bg-black/40 border border-white/5 rounded-full py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/30 transition-all"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
        
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-2 py-1 mb-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Music className="w-3 h-3" /> Search Results
              </div>
              {results.map(song => (
                <SongItem 
                  key={song.videoId} 
                  song={song} 
                  onPlay={playSong} 
                  onAdd={addToQueue} 
                  onToggleFav={toggleFavorite}
                  isFav={isFavorite(song.videoId)}
                />
              ))}
            </>
          ) : query && searchTerm ? (
            <div className="text-center py-12 text-zinc-600 flex flex-col items-center gap-2">
              <Music className="w-8 h-8 opacity-20" />
              <p className="text-[11px] font-black uppercase tracking-widest opacity-40">No results for "{searchTerm}"</p>
            </div>
          ) : recentlyPlayed.length > 0 ? (
            <>
              <div className="px-2 py-1 mb-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                <History className="w-3 h-3 text-pink-500/50" /> Recently Played
              </div>
              {recentlyPlayed.map(song => (
                <SongItem 
                  key={song.videoId} 
                  song={song} 
                  onPlay={playSong} 
                  onAdd={addToQueue} 
                  onToggleFav={toggleFavorite}
                  isFav={isFavorite(song.videoId)}
                  isRecent={true}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-zinc-600 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 opacity-10" />
              <p className="text-[11px] font-black uppercase tracking-widest opacity-30">Type to explore Music</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MusicSearch);
