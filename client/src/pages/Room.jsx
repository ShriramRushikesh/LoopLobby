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

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 flex flex-col lg:grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] overflow-hidden">
        
        {/* COLUMN 1: PLAYER & EXTRAS */}
        <div className={`${mobileTab === 'player' ? 'flex' : 'hidden'} lg:flex flex-col gap-6 h-full overflow-hidden`}>
          {/* Top: Player */}
          <div className="shrink-0 bg-white/5 rounded-[2.5rem] border border-white/10 p-4 shadow-xl backdrop-blur-md">
            <div className="lg:hidden">
              <RoomPlayer isHost={state?.isHost} username={state?.username} compact={true} />
            </div>
            <div className="hidden lg:block">
              <RoomPlayer isHost={state?.isHost} username={state?.username} />
            </div>
          </div>

          {/* Bottom: Couple Features */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/5 rounded-[2.5rem] border border-white/10 p-6 shadow-xl backdrop-blur-md">
             <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Couple Features</h3>
            </div>
            <CoupleFeatures username={state?.username} />
          </div>
        </div>
        
        {/* COLUMN 2: SEARCH & CONTENT TABS */}
        <div className={`${mobileTab === 'player' ? 'flex' : 'hidden'} lg:flex h-full flex-col gap-6 overflow-hidden`}>
          {/* Top: Search & Play */}
          <div className="h-[40%] bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-xl backdrop-blur-md flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Search & Play</h3>
              <Search className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <MusicSearch />
            </div>
          </div>

          {/* Bottom: Tabbed Content (Lyrics, Fav, Queue) */}
          <div className="flex-1 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-xl backdrop-blur-md flex flex-col">
            <div className="flex border-b border-white/10 bg-white/5 p-1">
              <button 
                onClick={() => setPlayerSubTab('lyrics')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${playerSubTab === 'lyrics' ? 'bg-white/10 text-pink-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Music className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Lyrics</span>
              </button>
              <button 
                onClick={() => setPlayerSubTab('fav')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${playerSubTab === 'fav' ? 'bg-white/10 text-pink-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fav</span>
              </button>
              <button 
                onClick={() => setPlayerSubTab('queue')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${playerSubTab === 'queue' ? 'bg-white/10 text-pink-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <ListMusic className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Queue</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {playerSubTab === 'lyrics' && (
                <div className="p-2">
                  {currentSong ? <SongLyrics currentSong={currentSong} /> : <div className="p-12 text-center text-zinc-500">Play a song to see lyrics</div>}
                </div>
              )}
              {playerSubTab === 'fav' && <FavoritesList />}
              {playerSubTab === 'queue' && <QueueList />}
            </div>
          </div>
        </div>

        {/* COLUMN 3: CHAT & ADS */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex h-full flex-col gap-6`}>
          {/* Top: Room Chat */}
          <div className="flex-1 bg-black/20 rounded-[2.5rem] border border-white/5 backdrop-blur-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Room Chat</h3>
              <div className="flex gap-1.5 opacity-50">
                <span className="text-xs">❤️</span><span className="text-xs">😍</span><span className="text-xs">🔥</span>
              </div>
            </div>
            <Chat username={state?.username} />
          </div>
          
          {/* Bottom: Advertisement & Support */}
          <div className="h-[35%] bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-white/5 rounded-[2.5rem] p-6 text-center shadow-xl backdrop-blur-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
            <AdBanner slot="SIDEBAR_SLOT" style={{ display: 'block' }} />
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-2">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Support LoopLobby</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                Keep the vibe alive. Support our sync space!
              </p>
            </div>
          </div>
        </div>
      </main>


      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-3 z-50 pb-6">
        <button onClick={() => setMobileTab('player')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'player' ? 'text-pink-400 scale-110' : 'text-zinc-500'}`}>
           <Music className="w-6 h-6" />
           <span className="text-[10px] font-bold uppercase tracking-wider">Player</span>
        </button>
        <button onClick={() => setMobileTab('extras')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'extras' ? 'text-pink-400 scale-110' : 'text-zinc-500'}`}>
           <Sparkles className="w-6 h-6" />
           <span className="text-[10px] font-bold uppercase tracking-wider">Extras</span>
        </button>
        <button onClick={() => setMobileTab('chat')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'chat' ? 'text-pink-400 scale-110' : 'text-zinc-500'}`}>
           <MessageSquare className="w-6 h-6" />
           <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
