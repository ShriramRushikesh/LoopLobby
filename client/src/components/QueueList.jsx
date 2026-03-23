import { useRoomStore } from '../store/useRoomStore';
import { Music, Play, Trash2 } from 'lucide-react';
import AdBanner from './AdBanner';

export default function QueueList() {
  const { room, socket, id: roomId } = useRoomStore();

  const playSong = (song) => {
    socket?.emit('change-song', { roomId, song });
  };

  const removeFromQueue = (index) => {
    // Logic for removing from queue if implemented on backend
    // socket?.emit('remove-from-queue', { roomId, index });
  };

  if (!room?.queue || room.queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <Music className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-zinc-500 font-medium tracking-tight">Your queue is empty.</p>
        <p className="text-zinc-600 text-xs mt-1 mb-6">Add some songs to keep the vibe alive!</p>
        
        {/* AdSense Placement 3: Between-session (Empty Queue) */}
        <div className="w-full mt-auto">
          <AdBanner slot="QUEUE_EMPTY_SLOT" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      <div className="px-2 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Up Next ({room.queue.length})</span>
      </div>
      {room.queue.map((song, i) => (
        <div 
          key={i} 
          className="group flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-pink-500/30 transition-all cursor-pointer"
          onClick={() => playSong(song)}
        >
          <div className="text-[10px] font-bold text-zinc-600 w-4 text-right shrink-0">{i + 1}</div>
          <div className="relative w-10 h-10 shrink-0">
            <img src={song.thumbnail} className="w-full h-full rounded-xl object-cover shadow-lg" alt={song.title} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-pink-400 transition-colors">{song.title}</p>
            <p className="text-[11px] text-zinc-500 font-medium">{song.artist}</p>
          </div>
          <button 
            className="p-2 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      {/* AdSense Placement 3: Bottom of Queue */}
      <AdBanner slot="QUEUE_BOTTOM_SLOT" />
    </div>
  );
}
