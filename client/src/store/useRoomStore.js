import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

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

  setRoom: (room) => set({
    room,
    queue: room?.queue || [],
    currentSong: room?.song || null,
    members: room?.users || [],
  }),
  // ... existing actions ...
  setSocket: (socket) => set({ socket }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setCurrentSong: (currentSong) => set({ currentSong }),
  updateCurrentSong: (song) => set((state) => ({
    room: state.room ? { ...state.room, song } : state.room,
    currentSong: song,
  })),
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

  // Cleanup for floating elements
  removeLoveNote: (id) => set((state) => ({ loveNotes: state.loveNotes.filter((n) => n.id !== id) })),
  removeVirtualGift: (id) => set((state) => ({ virtualGifts: state.virtualGifts.filter((g) => g.id !== id) })),
  removeEmoji: (id) => set((state) => ({ emojis: state.emojis.filter((e) => e.id !== id) })),
}));
