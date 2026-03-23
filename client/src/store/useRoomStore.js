import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  room: null,
  socket: null,

  // Sync & Timing
  latency: 0,
  serverOffset: 0,

  // Playback State (audio-first — defaults allow rendering without server data)
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  isAudible: false,
  currentSong: null,
  queue: [],
  members: [],

  // UI State
  moodMode: 'normal',
  chatMessages: [],
  loveNotes: [],
  virtualGifts: [],
  emojis: [],
  partnerTouching: false,
  isTyping: false,
  typingMsg: '',
  unreadChatCount: 0,
  recentlyPlayed: [],

  setRoom: (room) => set((state) => {
    const nextSong = room?.song || null;
    const isSameSong = (state.currentSong?.videoId === nextSong?.videoId) || (state.currentSong?.id === nextSong?.id);
    return {
      room,
      queue: room?.queue || [],
      currentSong: isSameSong ? state.currentSong : nextSong,
      members: room?.users || [],
    };
  }),
  // ... existing actions ...
  setSocket: (socket) => set({ socket }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setIsAudible: (isAudible) => set({ isAudible }),
  setCurrentSong: (currentSong) => set({ currentSong }),
  updateCurrentSong: (song) => set((state) => {
    if (song?.videoId && song.videoId !== state.currentSong?.videoId) {
      // Logic for recently played
      const filtered = state.recentlyPlayed.filter(s => s.videoId !== song.videoId);
      state.recentlyPlayed = [song, ...filtered].slice(0, 10);
    }
    return {
      room: state.room ? { ...state.room, song } : state.room,
      currentSong: song,
      progress: 0, // Reset progress on song change
      recentlyPlayed: [...state.recentlyPlayed], // ensure reactivity
    };
  }),
  setQueue: (queue) => set({ queue }),
  setMembers: (members) => set({ members }),
  setLatency: (latency) => set({ latency }),

  updateRoomQueue: (queue) => set((state) => ({
    room: { ...state.room, queue },
    queue,
  })),
  updateRoomFavorites: (favorites) => set((state) => ({
    room: { ...state.room, favorites },
  })),
  updateSong: (song) => set((state) => ({
    room: state.room ? { ...state.room, song } : state.room,
    currentSong: song,
    progress: 0, // Reset progress
  })),
  updateSongProgress: (progress) => set({ progress }),

  setMoodMode: (mood) => set({ moodMode: mood }),
  addChatMessage: (msg) => set((state) => ({ 
    chatMessages: [...state.chatMessages, msg],
    // Logic for unread is handled in the component to check current tab
  })),
  incrementUnreadChatCount: () => set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  resetUnreadChatCount: () => set({ unreadChatCount: 0 }),
  
  addLoveNote: (note) => set((state) => ({ loveNotes: [...state.loveNotes, note] })),
  addVirtualGift: (gift) => set((state) => ({ virtualGifts: [...state.virtualGifts, gift] })),
  addEmoji: (emoji) => set((state) => ({ emojis: [...state.emojis, emoji] })),

  setPartnerTouching: (touching) => set({ partnerTouching: touching }),
  setTyping: (isTyping, typingMsg) => set({ isTyping, typingMsg }),

  addToRecentlyPlayed: (song) => set((state) => {
    if (!song?.videoId) return state;
    const filtered = state.recentlyPlayed.filter(s => s.videoId !== song.videoId);
    const updated = [song, ...filtered].slice(0, 10);
    return { recentlyPlayed: updated };
  }),

  // Cleanup for floating elements
  removeLoveNote: (id) => set((state) => ({ loveNotes: state.loveNotes.filter((n) => n.id !== id) })),
  removeVirtualGift: (id) => set((state) => ({ virtualGifts: state.virtualGifts.filter((g) => g.id !== id) })),
  removeEmoji: (id) => set((state) => ({ emojis: state.emojis.filter((e) => e.id !== id) })),
}));
