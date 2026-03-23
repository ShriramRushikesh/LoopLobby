import React, { useState, memo } from 'react';
import { Search, Play, Plus, Heart, Music, ListMusic, Loader2 } from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useQuery } from '@tanstack/react-query';

const SongItem = memo(({ song, isQueue, onPlay, onAdd, onToggleFav, isFav }) => (
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
      <h4 className="text-sm font-medium text-white truncate">{song.title}</h4>
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

export default function MusicSearch() {
  const { room, socket } = useRoomStore();
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const { data: results = [], isLoading: loading } = useQuery({
    queryKey: ['music-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/music/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      return data.results || [];
    },
    enabled: !!searchTerm,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  const playSong = (song) => {
    const roomId = room?.roomId;
    if (!roomId || !socket) return;
    socket.emit('change-song', { roomId, song });
  };

  const addToQueue = (song) => {
    if (!room?.roomId || !socket) return;
    // Server handler listens for bare `song` argument
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
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs on YouTube..." 
            className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
          />
        </form>
        
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            results.map(song => (
              <SongItem 
                key={song.videoId} 
                song={song} 
                onPlay={playSong} 
                onAdd={addToQueue} 
                onToggleFav={toggleFavorite}
                isFav={isFavorite(song.videoId)}
              />
            ))
          ) : searchTerm ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-3">
              <Music className="w-12 h-12 opacity-20" />
              <p className="text-sm">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-3">
              <Music className="w-12 h-12 opacity-20" />
              <p className="text-sm">Search for a song to play</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
