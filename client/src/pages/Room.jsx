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
  const setSocket = useRoomStore(s => s.setSocket);
  const setRoom = useRoomStore(s => s.setRoom);
  const room = useRoomStore(s => s.room);
  const currentSong = useRoomStore(s => s.currentSong);
  const socket = useRoomStore(s => s.socket);
  const moodMode = useRoomStore(s => s.moodMode);
  const setMoodMode = useRoomStore(s => s.setMoodMode);
  const addChatMessage = useRoomStore(s => s.addChatMessage);
  const addLoveNote = useRoomStore(s => s.addLoveNote);
  const addVirtualGift = useRoomStore(s => s.addVirtualGift);
  const addEmoji = useRoomStore(s => s.addEmoji);
  const setTyping = useRoomStore(s => s.setTyping);
  const updateRoomQueue = useRoomStore(s => s.updateRoomQueue);
  const updateRoomFavorites = useRoomStore(s => s.updateRoomFavorites);
  const updateCurrentSong = useRoomStore(s => s.updateCurrentSong);
  const updateSongProgress = useRoomStore(s => s.updateSongProgress);
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
    
    // Playback state is primarily handled by GlobalAudioPlayer for the 'AntiGravity' engine,
    // but we listen here to keep the store in sync for UI components.
    newSocket.on('sync-song', (data) => {
      const song = data?.videoId ? data : data?.song;
      if (song) updateCurrentSong(song);
    });
    newSocket.on('sync-state', (state) => {
      if (state.song) updateCurrentSong(state.song);
      updateSongProgress(state.currentTime);
    });
    
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
  }, [id, state, navigate, setSocket, setRoom, setMoodMode, updateRoomQueue, updateRoomFavorites, updateCurrentSong, updateSongProgress, addChatMessage, addLoveNote, addVirtualGift, addEmoji, setTyping]);

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
      className={`min-h-[100dvh] transition-colors duration-1000 relative ${bgStyles[moodMode]} ${isShaking ? 'animate-[shake_0.2s_ease-in-out_4]' : ''}`}
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
            <Logo className="w-36 h-auto text-white" />
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
              <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                {/* Room Code Header */}
                <div className="bg-white/5 p-4 border-b border-white/5">
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 opacity-60">Room Address</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-pink-400 font-mono tracking-tight truncate">{id}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[9px] font-black uppercase text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md border border-white/5"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="py-1">
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
                    <span className="text-sm font-medium">Full Room Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

      <main className={`max-w-[1600px] mx-auto ${['chat', 'extras'].includes(mobileTab) ? 'p-0' : 'p-4'} lg:p-6 flex flex-col lg:grid lg:grid-cols-[1.3fr_0.85fr_0.85fr] gap-6 h-[calc(100dvh-145px)] lg:h-[calc(100dvh-80px)] overflow-hidden`}>
        
        {/* COLUMN 1: Room Extra (Desktop) / Player Tab (Mobile) */}
        <div className={`${mobileTab === 'player' ? 'flex' : 'hidden'} lg:flex flex-col gap-6 h-full overflow-hidden`}>
          {/* Unified Room Extra Card */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden ring-1 ring-white/5 transition-all duration-500">
            {/* Desktop View: Top-to-Bottom Flow */}
            <div className="hidden lg:flex flex-col h-full overflow-hidden">
               {/* Player Section */}
               <div className="p-4 border-b border-white/5">
                 <RoomPlayer isHost={state?.isHost} username={state?.username} />
               </div>
               
               {/* Features Section */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 <div className="shrink-0 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/60 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                   Room Extra
                 </div>
                 <CoupleFeatures username={state?.username} />
               </div>
            </div>

            {/* Mobile View: Compact Switcher (Unchanged logic, just inside new container) */}
            <div className="lg:hidden flex flex-col h-full overflow-hidden">
              <div className="shrink-0 bg-black/20">
                <RoomPlayer isHost={state?.isHost} username={state?.username} compact={true} />
              </div>
              {/* Lyrics Ribbon */}
              <button 
                onClick={() => setPlayerSubTab('lyrics')}
                className={`mx-4 mt-4 py-2 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all shadow-lg ${playerSubTab === 'lyrics' ? 'bg-purple-600 text-white' : 'bg-purple-900/40 text-purple-300'}`}
              >
                Lyrics
              </button>

              {/* Icon Tabs */}
              <div className="flex items-center justify-around py-4 mt-2">
                <button onClick={() => setPlayerSubTab('search')} className={`transition-all ${playerSubTab === 'search' ? 'text-blue-400 scale-125' : 'text-zinc-600'}`}>
                  <Search className="w-8 h-8" />
                </button>
                <button onClick={() => setPlayerSubTab('fav')} className={`transition-all ${playerSubTab === 'fav' ? 'text-blue-400 scale-125' : 'text-zinc-600'}`}>
                  <Heart className="w-8 h-8" />
                </button>
                <button onClick={() => setPlayerSubTab('queue')} className={`transition-all ${playerSubTab === 'queue' ? 'text-blue-400 scale-125' : 'text-zinc-600'}`}>
                  <ListMusic className="w-8 h-8" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar border-t border-white/5 bg-zinc-950/50">
                {playerSubTab === 'search' && <MusicSearch />}
                {playerSubTab === 'fav' && <FavoritesList />}
                {playerSubTab === 'queue' && <QueueList />}
                {playerSubTab === 'lyrics' && (
                  <div className="p-4">
                    {currentSong ? <SongLyrics currentSong={currentSong} /> : <div className="p-8 text-center text-zinc-500">Play a song to see lyrics</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* COLUMN 2: UNIFIED MUSIC HUB (Desktop) / Extras Tab (Mobile) */}
        <div className={`${mobileTab === 'extras' ? 'flex' : 'hidden'} lg:flex flex-col lg:gap-6 h-full overflow-hidden`}>
          {/* Unified Music Hub Card */}
          <div className="flex-1 flex flex-col min-h-0 lg:bg-black/40 lg:rounded-[2.5rem] lg:border lg:border-white/10 lg:shadow-2xl lg:backdrop-blur-3xl overflow-hidden lg:ring-1 lg:ring-white/5 transition-all duration-500">
             {/* Integrated Header: Tabs Switcher (Icons) */}
             <div className="hidden lg:flex flex-col shrink-0 bg-white/5 border-b border-white/10">
                <div className="flex px-6 gap-10 py-4 items-center">
                <div className="flex items-center gap-3 bg-zinc-900/50 px-2.5 py-1.5 rounded-xl border border-white/5">
                   <button 
                     onClick={() => setPlayerSubTab('search')} 
                     className={`transition-all hover:scale-110 ${playerSubTab === 'search' ? 'text-blue-400' : 'text-zinc-600'}`}
                     title="Search Music"
                   >
                      <Search className={`w-4 h-4 ${playerSubTab === 'search' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                   </button>
                   <button 
                     onClick={() => setPlayerSubTab('fav')} 
                     className={`transition-all hover:scale-110 ${playerSubTab === 'fav' ? 'text-pink-400' : 'text-zinc-600'}`}
                     title="Liked Songs"
                   >
                      <Heart className={`w-4 h-4 ${playerSubTab === 'fav' ? 'fill-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]' : ''}`} />
                   </button>
                   <button 
                     onClick={() => setPlayerSubTab('queue')} 
                     className={`transition-all hover:scale-110 ${playerSubTab === 'queue' ? 'text-purple-400' : 'text-zinc-600'}`}
                     title="Music Queue"
                   >
                      <ListMusic className={`w-4 h-4 ${playerSubTab === 'queue' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`} />
                   </button>
                </div>
</div>
             </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="hidden lg:block h-full">
                   {playerSubTab === 'search' && <MusicSearch />}
                   {playerSubTab === 'fav' && <FavoritesList />}
                   {playerSubTab === 'queue' && <QueueList />}
                </div>

                {/* Mobile View extras (fallback for this column) */}
                <div className="lg:hidden p-4 h-full">
                   <div className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Room Extras</div>
                   <CoupleFeatures username={state?.username} />
                </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Chat (Full Height) & Support (Desktop) / Chat Tab (Mobile) */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex flex-col lg:gap-6 h-full overflow-hidden`}>
           {/* Chat - Expanded Height */}
           <div className="flex-[4] lg:bg-black/40 lg:rounded-[2.5rem] lg:border lg:border-white/10 lg:shadow-2xl lg:backdrop-blur-3xl overflow-hidden flex flex-col min-h-0 lg:ring-1 lg:ring-white/5">
              <div className="px-5 lg:px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Live Messenger</span>
                </div>
                <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="flex-1 min-h-0 bg-zinc-950/20">
                <Chat username={state?.username} />
              </div>
           </div>

           {/* Support / Ads - Professional Footer Look */}
           <div className="hidden lg:block shrink-0 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl text-center">
              <div className="mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">Advertisement</div>
              <div className="flex items-center justify-center py-2">
                <AdBanner slot="SIDEBAR_SLOT" style={{ display: 'block' }} />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-zinc-600 uppercase text-[8px] font-black tracking-widest opacity-30">
                <Sparkles className="w-3 h-3" />
                <span>Support LoopLobby</span>
                <Sparkles className="w-3 h-3" />
              </div>
           </div>
        </div>
      </main>


      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/60 backdrop-blur-3xl border border-white/10 flex justify-around items-center p-3 z-50 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
        <button onClick={() => setMobileTab('player')} className={`relative flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'player' ? 'text-pink-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Music className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-wider">Player</span>
           {mobileTab === 'player' && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_8px_#ec4899]" />}
        </button>
        <button onClick={() => setMobileTab('extras')} className={`relative flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'extras' ? 'text-pink-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Sparkles className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-wider">Extras</span>
           {mobileTab === 'extras' && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_8px_#ec4899]" />}
        </button>
        <button onClick={() => setMobileTab('chat')} className={`relative flex-1 flex flex-col items-center gap-1 transition-all ${mobileTab === 'chat' ? 'text-pink-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <MessageSquare className="w-5 h-5" />
           <span className="text-[9px] font-black uppercase tracking-wider">Chat</span>
           {mobileTab === 'chat' && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_8px_#ec4899]" />}
        </button>
      </nav>
      </div>
    </div>
  );
}
