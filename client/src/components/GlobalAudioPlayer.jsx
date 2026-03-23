import React, { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';

// ─── Singleton Audio Engine ──────────────────────────────────────────────────
const _p = { ref: null };
const _s = { time: 0, at: 0, offset: 0 };
let _raf = null;
let _ticker = null;
let _started = false;
let _lastCorrection = 0; 
let _loadTimer = null;


export const audioEngine = {
  play() {
    _started = true;
    try { 
      _p.ref?.unMute(); 
      _p.ref?.setVolume(100); 
      _p.ref?.playVideo(); 
    } catch (_) {}
  },
  pause() {
    try { _p.ref?.pauseVideo(); } catch (_) {}
  },
  seek(t) {
    _s.time = t;
    _s.at = Date.now() + _s.offset;
    try { _p.ref?.seekTo(t, true); } catch (_) {}
  },
  unmute() {
    _started = true;
    try { 
      _p.ref?.unMute(); 
      _p.ref?.setVolume(100); 
      _p.ref?.playVideo();
    } catch (_) {}
  },
  loadSong(videoId, startAt = 0) {
    _s.time = startAt;
    _s.at = Date.now();
    try { _p.ref?.loadVideoById({ videoId, startSeconds: startAt }); } catch (_) {}
  },
  isReady() { return !!_p.ref; }
};

function serverNow() { return Date.now() + _s.offset; }
function expectedTime(isPlayingRef) {
  if (!isPlayingRef.current) return _s.time;
  // Use server-synced time to calculate exact position
  const now = Date.now() + _s.offset;
  const elapsed = Math.max(0, (now - _s.at) / 1000);
  return _s.time + elapsed;
}

function startEngine(setProgress, isPlayingRef) {
  if (_raf) cancelAnimationFrame(_raf);
  if (_ticker) clearInterval(_ticker);

  function loop() {
    const now = Date.now();
    // Only correct at most once every 3 seconds — prevents seek-buffering stutter
    if (_p.ref && isPlayingRef.current && _s.at && (now - _lastCorrection > 3000)) {
      try {
        const drift = _p.ref.getCurrentTime() - expectedTime(isPlayingRef);
        // Only seek if drift is significant (>500ms) — small drift self-corrects via playback rate
        if (Math.abs(drift) > 0.5) {
          _p.ref.seekTo(expectedTime(isPlayingRef), true);
          _lastCorrection = now;
        }
      } catch (_) {}
    }
    _raf = requestAnimationFrame(loop);
  }
  _raf = requestAnimationFrame(loop);

  _ticker = setInterval(() => {
    try {
      // isAudible is passed from the store to the component, so we need to check it from the store state
      // But startEngine is outside. We'll pass a ref or check window variables if needed.
      // Better: check the player's own internal state and a local static flag.
      if (_p.ref && isPlayingRef.current) {
        // Only update progress if actually playing and not in the first 3s of loading
        const state = _p.ref.getPlayerState();
        if (state === 1) setProgress(_p.ref.getCurrentTime());
      }
    } catch (_) {}
  }, 1000);
}

export default function GlobalAudioPlayer() {
  const {
    currentSong, isPlaying, volume, isAudible,
    setProgress, setIsPlaying, setCurrentSong, setLatency, setDuration, updateCurrentSong,
    setIsAudible, socket, room, queue,
  } = useRoomStore();

  const roomId = room?.roomId || room?.id;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Track previous song to detect changes
  const prevVideoId = useRef(null);

  useEffect(() => {
    startEngine(setProgress, isPlayingRef);
    return () => { cancelAnimationFrame(_raf); clearInterval(_ticker); };
  }, []);

  useEffect(() => {
    const vid = currentSong?.videoId || currentSong?.id;
    if (!vid) return;

    // Reset audible state immediately on song change
    if (prevVideoId.current !== vid) {
      setIsAudible(false);
      prevVideoId.current = vid;
    }

    if (_p.ref) {
      if (_loadTimer) clearTimeout(_loadTimer);

      const wait = 3000; // 3 second mandatory pre-load/intro delay
      
      const startAt = Math.max(0, expectedTime(isPlayingRef));
      console.log(`[GlobalPlayer] Pre-loading ${vid} at ${startAt}s (3s delay starting...)`);

      try {
        // Load muted first to allow buffering without audio-jump
        _p.ref.mute();
        _p.ref.loadVideoById({ videoId: vid, startSeconds: startAt });
        _p.ref.pauseVideo(); // Buffer while paused or play muted? Let's play muted if started.
        
        if (_started) {
          _p.ref.playVideo();
        }

        _loadTimer = setTimeout(() => {
          console.log(`[GlobalPlayer] 3s delay over, enabling audio for ${vid}`);
          try {
            if (_started) {
              _p.ref.unMute(); 
              _p.ref.setVolume(volumeRef.current * 100);
              _p.ref.playVideo();
              setIsAudible(true);
            }
          } catch (e) {}
        }, wait);

      } catch (e) {
        console.error("[GlobalPlayer] Load error:", e);
      }

      return () => {
        if (_loadTimer) clearTimeout(_loadTimer);
      };
    }
  }, [currentSong?.videoId, currentSong?.id, isPlayingRef]);

  // Latency
  useEffect(() => {
    if (!socket) return;
    const iv = setInterval(() => socket.emit('ping-sync', Date.now()), 5000);
    const onPong = ({ timestamp, serverTime }) => {
      const rtt = Date.now() - timestamp;
      _s.offset = serverTime - (Date.now() - rtt / 2);
      setLatency(rtt);
    };
    socket.on('pong-sync', onPong);
    return () => { clearInterval(iv); socket.off('pong-sync', onPong); };
  }, [socket, setLatency]);

  // Socket sync listeners
  useEffect(() => {
    if (!socket) return;

    const onSyncPlay = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      setIsPlaying(true);
      try { _p.ref?.unMute(); _p.ref?.setVolume(volumeRef.current * 100); _p.ref?.playVideo(); } catch (_) {}
    };

    const onSyncPause = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      setIsPlaying(false);
      try { _p.ref?.pauseVideo(); } catch (_) {}
    };

    const onSyncProgress = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      
      const expected = expectedTime(isPlayingRef);
      const actual = _p.ref?.getCurrentTime() || 0;
      const off = expected - actual;
      
      // Tighten sync to 0.5s for "exact timing"
      if (Math.abs(off) > 0.5) {
        _p.ref?.seekTo(expected, true);
      }
    };

    const onSyncSeek = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      _lastCorrection = Date.now();
      try { _p.ref?.seekTo(currentTime, true); } catch (_) {}
    };

    const onSyncSong = (payload) => {
      // Handle both old (bare song) and new ({song, serverTime}) formats
      const song = payload?.videoId ? payload : payload?.song;
      const serverTime = payload?.serverTime || Date.now();
      if (!song) return;
      _s.time = 0;
      _s.at = serverTime;
      setCurrentSong(song);   // triggers currentSong useEffect → loadVideoById
      setIsPlaying(true);
    };

    const onSyncState = (state) => {
      if (!state.song) return;
      _s.time = state.currentTime;
      _s.at = state.serverTime || Date.now();
      setCurrentSong(state.song);
      setIsPlaying(state.isPlaying);
    };

    socket.on('sync-play', onSyncPlay);
    socket.on('sync-pause', onSyncPause);
    socket.on('sync-seek', onSyncSeek);
    socket.on('sync-song', onSyncSong);
    socket.on('sync-state', onSyncState);
    return () => {
      socket.off('sync-play', onSyncPlay);
      socket.off('sync-pause', onSyncPause);
      socket.off('sync-seek', onSyncSeek);
      socket.off('sync-song', onSyncSong);
      socket.off('sync-state', onSyncState);
    };
  }, [socket]);

  // MediaSession
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title, artist: currentSong.artist || 'LoopLobby Sync',
      artwork: [{ src: currentSong.thumbnail, sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => { audioEngine.play(); setIsPlaying(true); socket?.emit('play', { roomId, currentTime: _p.ref?.getCurrentTime() || 0 }); });
    navigator.mediaSession.setActionHandler('pause', () => { audioEngine.pause(); setIsPlaying(false); socket?.emit('pause', { roomId, currentTime: _p.ref?.getCurrentTime() || 0 }); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] }); });
  }, [currentSong?.videoId]);

  const onPlayerReady = useCallback((event) => {
    _p.ref = event.target;
    // Start muted — mobile autoplay policy
    _p.ref.mute();
    _p.ref.setVolume(0);

    // Load any pending song
    const vid = currentSong?.videoId || currentSong?.id;
    if (vid) {
      const startAt = _s.at > 0 ? Math.max(0, expectedTime()) : 0;
      _p.ref.loadVideoById({ videoId: vid, startSeconds: startAt });
    }

    if (isPlayingRef.current) {
      _p.ref.playVideo();
      if (_started) {
        setTimeout(() => { try { _p.ref?.unMute(); _p.ref?.setVolume(volumeRef.current * 100); } catch (_) {} }, 300);
      }
    }
  }, []);

  const onStateChange = useCallback((event) => {
    if (event.data === 1 && !isPlayingRef.current) setIsPlaying(true);
    if (event.data === 2 && isPlayingRef.current) setIsPlaying(false);
  }, []);

  const onEnd = useCallback(() => {
    if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
  }, [queue, socket, roomId]);

  // Keep ONE YouTube instance alive forever — song changes use loadVideoById
  if (!currentSong) return null;

  return (
    <div aria-hidden="true" style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, opacity: 0.01, overflow: 'hidden', pointerEvents: 'none' }}>
      <YouTube
        videoId={currentSong?.videoId || currentSong?.id}
        opts={{
          width: '1', height: '1',
          playerVars: { 
            autoplay: 1, 
            controls: 0, 
            rel: 0, 
            playsinline: 1, 
            fs: 0, 
            modestbranding: 1,
            origin: window.location.origin,
            enablejsapi: 1
          },
        }}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        onEnd={onEnd}
        onError={(e) => {
          console.error("YouTube Player Error:", e.data);
          // Auto-skip if video fails
          if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
        }}
      />
    </div>
  );
}
