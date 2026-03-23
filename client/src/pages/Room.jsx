import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';
import RoomPlayer from '../components/RoomPlayer';
import Chat from '../components/Chat';
import { audioEngine } from '../components/GlobalAudioPlayer';
import CoupleFeatures from '../components/CoupleFeatures';
import LoveNotes from '../components/LoveNotes';
import Logo from '../components/Logo';
import MusicSearch from '../components/MusicSearch';
import SongLyrics from '../components/SongLyrics';
import QueueList from '../components/QueueList';
import FavoritesList from '../components/FavoritesList';
import AdBanner from '../components/AdBanner';
import { Share2, Users, MessageCircle, Instagram, Music, Search, Sparkles, MessageSquare, Heart, ListMusic } from 'lucide-react';

export default function Room() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setSocket, setRoom, room, currentSong, socket, moodMode, setMoodMode, addChatMessage, addLoveNote, addVirtualGift, addEmoji, setTyping, updateRoomQueue, updateRoomFavorites, updateCurrentSong, updateSongProgress } = useRoomStore();
  const [isShaking, setIsShaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState('player');
  const [playerSubTab, setPlayerSubTab] = useState('search'); // 'search', 'fav', 'queue'

  useEffect(() => {
    if (!state?.username) {
      navigate(`/?roomId=${id}`);
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');
    setSocket(newSocket);

    newSocket.emit('join_room', { 
      roomId: id, 
      username: state.username, 
      isHost: state.isHost,
      isCoupleMode: state.isCoupleMode 
    });

    newSocket.on('room_update', setRoom);
    newSocket.on('mood_changed', setMoodMode);
    
    newSocket.on('queue_updated', updateRoomQueue);
    newSocket.on('favorites_updated', updateRoomFavorites);
    newSocket.on('sync_player', updateCurrentSong);
    newSocket.on('sync_progress', updateSongProgress);
    
    newSocket.on('receive_message', addChatMessage);
    newSocket.on('receive_love_note', addLoveNote);
    newSocket.on('receive_gift', addVirtualGift);
    newSocket.on('receive_emoji', addEmoji);
    newSocket.on('partner_typing', (data) => setTyping(data.isTyping, data.msg));
    newSocket.on('attention_stolen', () => {
      setIsShaking(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => setIsShaking(false), 800);
    });
    newSocket.on('error', (err) => {
      alert(err.message);
      navigate('/');
    });

    return () => newSocket.disconnect();
  }, [id, state, navigate]);

  const shareToWhatsApp = () => {
    const text = `Join my LoopLobby Sync Room to vibing together! ❤️🎵\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct "share to DM" URL like WhatsApp, 
    // so we copy link and notify user to share it there.
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    alert('Link copied! You can now paste it in Instagram DMs.');
  };

  if (!state?.username) {
    navigate(`/?roomId=${id}`);
    // Still render nothing while navigating
    return null;
  }

  const bgStyles = {
    normal: 'from-zinc-950 via-zinc-900 to-zinc-950 bg-gradient-to-br',
    candlelight: 'from-orange-950 via-red-950 to-zinc-950 bg-gradient-to-br',
    sunset: 'bg-sunset-animated',
    stars: 'from-blue-950 via-zinc-950 to-black bg-gradient-to-br'
  };

  const handleInteraction = () => {
    if (audioEngine.isReady()) {
      audioEngine.unmute();
    }
  };

  return (
    <div 
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className={`min-h-screen transition-colors duration-1000 relative ${bgStyles[moodMode]} ${isShaking ? 'animate-[shake_0.2s_ease-in-out_4]' : ''}`}
    >
      
      {/* Dynamic Sunset Background */}
      {moodMode === 'sunset' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full blur-[60px] opacity-80 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-full h-[45%] bg-gradient-to-t from-[#0f172a] via-[#1e1b4b]/80 to-transparent flex flex-col justify-end">
            <div className="w-full h-4 bg-orange-400/20 blur-sm animate-ripple mb-2"></div>
            <div className="w-full h-6 bg-yellow-500/10 blur-sm animate-ripple-delayed mb-4"></div>
            <div className="w-full h-8 bg-red-500/10 blur-md animate-ripple mb-8"></div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        <LoveNotes />
          <header className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl sticky top-0 z-[100]">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">LoopLobby</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{room?.users?.length ?? '...'}{room?.isCoupleMode ? '/2' : ''} Users</span>
              </div>
            </div>
            
            {/* Share Dropdown Button */}
            <div className="relative group">
              <button className="flex flex-col items-center">
                <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-0.5 text-[8px] font-bold text-blue-400/70 mt-0.5 uppercase tracking-tighter">
                  Share <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                <button 
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-300 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span className="text-sm">WhatsApp</span>
                </button>
                <button 
                  onClick={shareToInstagram}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-300 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#dc2743]" />
                  <span className="text-sm">Instagram</span>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-300 transition-colors border-t border-white/5"
                >
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 h-[calc(100dvh-140px)] lg:h-[calc(100dvh-100px)] overflow-hidden">
        
        {/* LEFT COLUMN: Player & Lyrics */}
        <div className={`${mobileTab === 'player' ? 'flex animate-in fade-in duration-300' : 'hidden'} lg:flex flex-col gap-4 h-full min-h-0`}>
          <div className="shrink-0">
            <div className="lg:hidden">
              <RoomPlayer isHost={state?.isHost} username={state?.username} compact={true} />
            </div>
            <div className="hidden lg:block">
              <RoomPlayer isHost={state?.isHost} username={state?.username} />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="flex border-b border-white/10 bg-white/5">
              <button 
                onClick={() => setPlayerSubTab('lyrics')}
                className={`flex-1 flex flex-col items-center py-4 transition-all ${playerSubTab === 'lyrics' ? 'text-pink-400 bg-white/5 shadow-[inset_0_-2px_0_0_#ec4899]' : 'text-zinc-500'}`}
              >
                <Music className="w-5 h-5" />
                <p className="text-[10px] font-black uppercase mt-1 tracking-widest">Lyrics</p>
              </button>
              <button 
                onClick={() => setPlayerSubTab('fav')}
                className={`flex-1 flex flex-col items-center py-4 transition-all ${playerSubTab === 'fav' ? 'text-pink-400 bg-white/5 shadow-[inset_0_-2px_0_0_#ec4899]' : 'text-zinc-500'}`}
              >
                <Heart className="w-5 h-5" />
                <p className="text-[10px] font-black uppercase mt-1 tracking-widest">Fav</p>
              </button>
              <button 
                onClick={() => setPlayerSubTab('queue')}
                className={`flex-1 flex flex-col items-center py-4 transition-all ${playerSubTab === 'queue' ? 'text-pink-400 bg-white/5 shadow-[inset_0_-2px_0_0_#ec4899]' : 'text-zinc-500'}`}
              >
                <ListMusic className="w-5 h-5" />
                <p className="text-[10px] font-black uppercase mt-1 tracking-widest">Queue</p>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {playerSubTab === 'lyrics' && (
                <div className="p-4">
                  {currentSong ? <SongLyrics currentSong={currentSong} /> : <div className="p-12 text-center text-zinc-500">Play a song to see lyrics</div>}
                </div>
              )}
              {playerSubTab === 'fav' && <FavoritesList />}
              {playerSubTab === 'queue' && <QueueList />}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Search & Results */}
        <div className={`${mobileTab === 'search' ? 'flex animate-in fade-in duration-300' : 'hidden'} lg:flex flex-col h-full min-h-0 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl`}>
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Search & Play</h3>
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <MusicSearch />
          </div>
          
          <div className="hidden lg:block shrink-0 p-4 border-t border-white/5 bg-black/20">
             <CoupleFeatures username={state?.username} />
          </div>
        </div>

        {/* RIGHT COLUMN: Chat */}
        <div className={`${mobileTab === 'chat' ? 'flex animate-in fade-in duration-300' : 'hidden'} lg:flex flex-col h-full min-h-0 gap-4`}>
          <div className="flex-1 bg-black/20 rounded-[2.5rem] border border-white/5 backdrop-blur-md overflow-hidden flex flex-col shadow-xl min-h-0">
            <Chat username={state?.username} />
          </div>
          
          <div className="hidden lg:block p-6 bg-pink-500/10 border border-white/5 rounded-[2rem] text-center shrink-0">
            <AdBanner slot="SIDEBAR_SLOT" style={{ display: 'block', marginBottom: '12px' }} />
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Support LoopLobby</h4>
            </div>
          </div>
        </div>
      </main>


      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full flex justify-around items-center p-2 z-[100] shadow-2xl">
        <button onClick={() => setMobileTab('player')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${mobileTab === 'player' ? 'text-pink-400 scale-110' : 'text-zinc-500'}`}>
           <Music className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Vibe</span>
        </button>
        <button onClick={() => setMobileTab('search')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${mobileTab === 'search' ? 'text-blue-400 scale-110' : 'text-zinc-500'}`}>
           <Search className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Search</span>
        </button>
        <button onClick={() => setMobileTab('chat')} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${mobileTab === 'chat' ? 'text-purple-400 scale-110' : 'text-zinc-500'}`}>
           <MessageSquare className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Chat</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
