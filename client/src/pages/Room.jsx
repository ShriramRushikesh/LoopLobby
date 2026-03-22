import React, { useEffect, useState, useMemo, memo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';
import RoomPlayer from '../components/RoomPlayer';
import Chat from '../components/Chat';
import CoupleFeatures from '../components/CoupleFeatures';
import LoveNotes from '../components/LoveNotes';
import Logo from '../components/Logo';
import MusicSearch from '../components/MusicSearch';
import { Share2, Users, MessageCircle, Instagram, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../components/GlobalAudioPlayer';

// Memoize sub-components to prevent parent re-renders from affecting them
const MemoizedRoomPlayer = memo(RoomPlayer);
const MemoizedCoupleFeatures = memo(CoupleFeatures);
const MemoizedMusicSearch = memo(MusicSearch);
const MemoizedChat = memo(Chat);

export default function Room() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Use individual selectors to prevent re-rendering the whole page on every store update
  const socket = useRoomStore(s => s.socket);
  const setSocket = useRoomStore(s => s.setSocket);
  const setRoom = useRoomStore(s => s.setRoom);
  const userCount = useRoomStore(s => s.room?.users?.length);
  const isCoupleMode = useRoomStore(s => s.room?.isCoupleMode);
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
  const unreadChatCount = useRoomStore(s => s.unreadChatCount);
  const incrementUnreadChatCount = useRoomStore(s => s.incrementUnreadChatCount);
  const resetUnreadChatCount = useRoomStore(s => s.resetUnreadChatCount);
  
  const [isShaking, setIsShaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState('player');
  const [hasEntered, setHasEntered] = useState(false);
  const [lastNotify, setLastNotify] = useState(null);

  const enterRoom = () => {
    setHasEntered(true);
    // Call unmute/play directly within user gesture to unlock mobile audio
    audioEngine.unmute();
    audioEngine.play();
  };

  // Reset unread count when chat tab is active
  useEffect(() => {
    if (mobileTab === 'chat') {
      resetUnreadChatCount();
    }
  }, [mobileTab, resetUnreadChatCount]);

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
    newSocket.on('sync-song', updateCurrentSong);
    newSocket.on('sync-progress', updateSongProgress);
    
    newSocket.on('receive_message', (msg) => {
      addChatMessage(msg);
      // Only notify if not from self
      if (msg.user !== state.username) {
        setLastNotify({ user: msg.user, text: msg.text });
        setTimeout(() => setLastNotify(null), 3000);
        // Increment unread count if not on chat tab
        if (mobileTab !== 'chat') {
          incrementUnreadChatCount();
        }
      }
    });
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
    const text = `Join my RuRu Sync Room to vibing together! ❤️🎵\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToInstagram = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    alert('Link copied! You can now paste it in Instagram DMs.');
  };

  if (!state?.username) return null;

  const bgStyles = {
    normal: 'from-zinc-950 via-zinc-900 to-zinc-950 bg-gradient-to-br',
    candlelight: 'from-orange-950 via-red-950 to-zinc-950 bg-gradient-to-br',
    sunset: 'bg-sunset-animated',
    stars: 'from-blue-950 via-zinc-950 to-black bg-gradient-to-br'
  };

  const tabVariants = {
    enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 })
  };

  const tabIndex = { player: 0, search: 1, extras: 2, chat: 3 };
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab) => {
    setDirection(tabIndex[newTab] > tabIndex[mobileTab] ? 1 : -1);
    setMobileTab(newTab);
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 relative ${bgStyles[moodMode]} ${isShaking ? 'animate-[shake_0.2s_ease-in-out_4]' : ''} overflow-hidden font-sans text-zinc-100`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {lastNotify && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            onClick={() => handleTabChange('chat')}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 cursor-pointer min-w-[300px] group"
          >
            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-pink-400 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-0.5">New Message</p>
              <p className="text-sm font-bold text-white truncate"><span className="text-zinc-400">{lastNotify.user}:</span> {lastNotify.text}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasEntered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
          >
            <div className="text-center p-8 max-w-sm w-full">
              <Logo className="h-16 w-auto mx-auto mb-8 text-pink-500 animate-pulse" />
              <h1 className="text-3xl font-black text-zinc-100 mb-2">Ready to Sync?</h1>
              <p className="text-zinc-500 mb-8 text-sm leading-relaxed">Join the room and unlock high-fidelity audio sync with your partner.</p>
              <button 
                onClick={enterRoom}
                className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-4 rounded-full shadow-2xl shadow-pink-500/30 transition-all hover:scale-105 active:scale-95 text-lg"
              >
                ENTER VIBE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background with higher z-index than blurred content */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <GlobalAudioPlayer />
      
      {moodMode === 'sunset' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full blur-[60px] opacity-80 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-[45%] bg-gradient-to-t from-[#0f172a] via-[#1e1b4b]/80 to-transparent flex flex-col justify-end">
            <div className="w-full h-4 bg-orange-400/20 blur-sm animate-ripple mb-2" />
            <div className="w-full h-6 bg-yellow-500/10 blur-sm animate-ripple-delayed mb-4" />
            <div className="w-full h-8 bg-red-500/10 blur-md animate-ripple mb-8" />
          </div>
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col">
        <LoveNotes />
        
        <header className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Logo className="h-8 md:h-10 w-auto text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
            <span className="text-zinc-600 hidden md:inline-block">|</span>
            <span className="text-sm font-medium bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline-block truncate max-w-[120px] lg:max-w-none">
              RuRu Sync {isCoupleMode ? '🕊️💕' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-zinc-400 bg-black/30 px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-white/5">
              <Users className="w-3.5 h-3.5 md:w-4 h-4 text-pink-500" />
              <span className="text-xs md:text-sm font-bold text-white">{userCount ?? '...'}{isCoupleMode ? '/2' : ''}</span>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2">
              <button onClick={shareToWhatsApp} className="bg-[#25D366] hover:bg-[#20ba56] text-white p-1.5 md:p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-90">
                <MessageCircle className="w-4 h-4 md:w-5 h-5 fill-current" />
              </button>
              <button onClick={shareToInstagram} className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white p-1.5 md:p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-90">
                <Instagram className="w-4 h-4 md:w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-bold border border-white/10 min-w-[40px] md:min-w-[140px]"
              >
                <Share2 className="w-3.5 h-3.5 md:w-4 h-4 text-pink-400" />
                <span className="hidden md:inline">{copied ? 'Copied!' : `Invite: ${id}`}</span>
                {copied && <span className="md:hidden">✓</span>}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8 overflow-hidden relative">
          {/* Desktop Layout */}
          <div className="hidden lg:grid grid-cols-4 gap-6 h-full">
            <div className="col-span-2 flex flex-col gap-6 overflow-y-auto pb-4 custom-scrollbar">
              <MemoizedRoomPlayer isHost={state?.isHost} username={state?.username} />
              <MemoizedCoupleFeatures username={state?.username} />
            </div>
            <div className="col-span-1 h-full flex flex-col">
              <MemoizedMusicSearch />
            </div>
            <div className="col-span-1 h-full flex flex-col bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md overflow-hidden relative">
              <MemoizedChat username={state?.username} />
            </div>
          </div>

          {/* Mobile Layout with Animated Transitions */}
          <div className="lg:hidden h-full">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={mobileTab}
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full flex flex-col"
              >
                {mobileTab === 'player' && (
                  <div className="flex flex-col gap-4 overflow-y-auto pb-20 custom-scrollbar">
                    <MemoizedRoomPlayer isHost={state?.isHost} username={state?.username} />
                  </div>
                )}
                {mobileTab === 'search' && (
                  <div className="flex-1 pb-20">
                    <MemoizedMusicSearch />
                  </div>
                )}
                {mobileTab === 'extras' && (
                  <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                    <MemoizedCoupleFeatures username={state?.username} />
                  </div>
                )}
                {mobileTab === 'chat' && (
                  <div className="flex-1 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md overflow-hidden pb-20">
                    <MemoizedChat username={state?.username} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-2 z-50 pb-6">
          {[
            { id: 'player', label: 'Player', icon: <svg className="w-5 h-5 md:w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg> },
            { id: 'search', label: 'Search', icon: <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
            { id: 'extras', label: 'Vibes', icon: <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
            { id: 'chat', label: 'Chat', icon: <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
          ].map(tab => (
            <motion.button 
              key={tab.id}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTabChange(tab.id)} 
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors relative ${mobileTab === tab.id ? 'text-pink-400' : 'text-zinc-500'}`}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'chat' && unreadChatCount > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg border border-black animate-pulse"
                  >
                    {unreadChatCount}
                  </motion.div>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${mobileTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
              {mobileTab === tab.id && <motion.div layoutId="activeTab" className="w-1 h-1 bg-pink-400 rounded-full mt-0.5" />}
            </motion.button>
          ))}
        </nav>
      </div>
    </div>
  );
}
