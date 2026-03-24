import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';

// ─── Singleton Audio Engine ──────────────────────────────────────────────────
const _p = { ref: null };
const _s = { time: 0, at: 0, offset: 0 };
let _raf = null;
let _started = false;
let _lastCorrection = 0;
let _loadTimer = null;

// ── Resync lock ───────────────────────────────────────────────────────────────
// When the engine triggers its own pause→seek→play cycle, YouTube fires
// onStateChange(2) then onStateChange(1). Without a lock, those events fight
// the authoritative isPlaying state and cause the UI to flicker play→pause→play.
// The lock blocks onStateChange from updating React state during any internal seek.
let _internalSeek = false;
const INTERNAL_SEEK_LOCK_MS = 600; // covers pause + seek + buffer + play

function lockSeek() {
  _internalSeek = true;
  setTimeout(() => { _internalSeek = false; }, INTERNAL_SEEK_LOCK_MS);
}

const UNMUTE_DELAY = 1000;

// ─── Audio Engine API ─────────────────────────────────────────────────────────
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
    _s.at = serverNow();
    lockSeek();
    try {
      _p.ref?.pauseVideo();
      _p.ref?.seekTo(t, true);
      _p.ref?.playVideo();
    } catch (_) {}
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
  isReady() { return !!_p.ref; },
  getCurrentTime() {
    try { return _p.ref?.getCurrentTime() || 0; } catch (_) { return 0; }
  },
};

function serverNow() { return Date.now() + _s.offset; }

function expectedTime(isPlayingRef) {
  if (!isPlayingRef.current || !_s.at) return _s.time;
  const elapsed = Math.max(0, (serverNow() - _s.at) / 1000);
  return _s.time + elapsed;
}

// ── Single correction function — used by BOTH the RAF loop and socket events ──
// Centralising here means only one system ever seeks. Two systems seeking on
// different schedules was the root cause of the inter-user lag.
function applySyncCorrection(isPlayingRef) {
  if (!_p.ref || !_s.at || !isPlayingRef.current) return;

  let actual;
  try { actual = _p.ref.getCurrentTime(); } catch (_) { return; }

  const expected = expectedTime(isPlayingRef);
  const drift = actual - expected;
  const absDrift = Math.abs(drift);

  if (absDrift > 0.1) {
    console.log(`[AntiGravity] Drift ${drift.toFixed(3)}s → atomic resync`);
    lockSeek();
    try {
      _p.ref.pauseVideo();
      _p.ref.seekTo(expected, true);
      _p.ref.playVideo();
      _p.ref.setPlaybackRate(1.0);
    } catch (_) {}
  } else if (absDrift > 0.03) {
    // Soft nudge — no seek, no lock needed
    try { _p.ref.setPlaybackRate(drift > 0 ? 0.95 : 1.05); } catch (_) {}
  } else {
    try { _p.ref.setPlaybackRate(1.0); } catch (_) {}
  }
}

function startEngine(setProgress, isPlayingRef) {
  if (_raf) cancelAnimationFrame(_raf);

  function loop() {
    const now = Date.now();

    if (!_p.ref || !_s.at) {
      _raf = requestAnimationFrame(loop);
      return;
    }

    // 1. 60fps UI progress update
    if (isPlayingRef.current) {
      try {
        if (_p.ref.getPlayerState() === 1) {
          setProgress(_p.ref.getCurrentTime());
        }
      } catch (_) {}
    }

    // 2. Sync correction every 100ms — skip during internal seeks to avoid
    //    compounding corrections on top of an in-flight resync
    if (!_internalSeek && now - _lastCorrection > 100) {
      applySyncCorrection(isPlayingRef);
      _lastCorrection = now;
    }

    _raf = requestAnimationFrame(loop);
  }

  _raf = requestAnimationFrame(loop);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GlobalAudioPlayer() {
  const {
    currentSong, isPlaying, volume, isAudible,
    setProgress, setIsPlaying, setCurrentSong, setLatency, setDuration,
    setIsAudible, socket, room, queue, updateCurrentSong,
  } = useRoomStore();

  const roomId = room?.roomId || room?.id;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const prevVideoId = useRef(null);
  const unmutedForCurrent = useRef(false);

  // ── Engine start ────────────────────────────────────────────────────────────
  useEffect(() => {
    startEngine(setProgress, isPlayingRef);
    
    // Interaction Unlock: Required by browsers to enable audio context/playback
    const unlock = () => {
      if (!_started) {
        console.log('[AntiGravity] Audio Unlocked');
        _started = true;
        // Resume any pending audio
        if (isPlayingRef.current && _p.ref) {
          try {
            _p.ref.unMute();
            _p.ref.setVolume(volumeRef.current * 100);
            _p.ref.playVideo();
            setIsAudible(true);
            unmutedForCurrent.current = true;
          } catch (_) {}
        }
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    return () => { 
      cancelAnimationFrame(_raf); 
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // ── Song load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const vid = currentSong?.videoId || currentSong?.id;
    if (!vid || !_p.ref) return;

    if (prevVideoId.current !== vid) {
      setIsAudible(false);
      unmutedForCurrent.current = false;
      prevVideoId.current = vid;
    }

    if (_loadTimer) clearTimeout(_loadTimer);

    const currentLoaded = _p.ref.getVideoData?.()?.video_id;
    const startAt = Math.max(0, expectedTime(isPlayingRef));

    if (currentLoaded === vid) {
      console.log(`[GlobalPlayer] ${vid} already loaded. Syncing to ${startAt.toFixed(2)}s`);
      lockSeek();
      _p.ref.seekTo(startAt, true);
      if (isPlayingRef.current) _p.ref.playVideo();
      return;
    }

    try {
      _p.ref.mute();
      _p.ref.loadVideoById({ videoId: vid, startSeconds: startAt });
      if (_started) _p.ref.playVideo();

      _loadTimer = setTimeout(() => {
        if (unmutedForCurrent.current) return;
        try {
          if (_started) {
            // Re-seek after buffer delay to correct for time elapsed during load
            const corrected = Math.max(0, expectedTime(isPlayingRef));
            lockSeek();
            _p.ref.seekTo(corrected, true);
            _p.ref.unMute();
            _p.ref.setVolume(volumeRef.current * 100);
            _p.ref.playVideo();
            setIsAudible(true);
            unmutedForCurrent.current = true;
          }
        } catch (e) {}
      }, UNMUTE_DELAY);
    } catch (e) {
      console.error('[GlobalPlayer] Load error:', e);
    }

    return () => { if (_loadTimer) clearTimeout(_loadTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.videoId, currentSong?.id]);

  // ── Latency / clock offset ──────────────────────────────────────────────────
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

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onSyncPlay = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      setIsPlaying(true);
      setProgress(currentTime);
      const target = expectedTime(isPlayingRef);
      lockSeek();
      try {
        _p.ref?.unMute();
        _p.ref?.setVolume(volumeRef.current * 100);
        _p.ref?.seekTo(target, true);
        _p.ref?.playVideo();
      } catch (_) {}
    };

    const onSyncPause = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      setIsPlaying(false);
      setProgress(currentTime);
      lockSeek();
      try {
        _p.ref?.seekTo(currentTime, true);
        _p.ref?.pauseVideo();
      } catch (_) {}
    };

    const onSyncProgress = ({ currentTime, serverTime }) => {
      // Update the clock reference ONLY — do NOT seek here.
      // The RAF engine's applySyncCorrection() owns all seeking.
      // Seeking here too was the root cause of the lag between users —
      // two systems correcting on different schedules created oscillation.
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
    };

    const onSyncSeek = ({ currentTime, serverTime }) => {
      _s.time = currentTime;
      _s.at = serverTime || Date.now();
      _lastCorrection = Date.now();
      lockSeek();
      try { _p.ref?.seekTo(currentTime, true); } catch (_) {}
    };

    const onSyncSong = (payload) => {
      const song = payload?.videoId ? payload : payload?.song;
      const serverTime = payload?.serverTime || Date.now();
      if (!song) return;
      _s.time = 0;
      _s.at = serverTime;
      updateCurrentSong(song);
      setIsPlaying(true);
      setProgress(0);
    };

    const onSyncState = (state) => {
      if (!state.song) return;
      _s.time = state.currentTime;
      _s.at = state.serverTime || Date.now();
      setCurrentSong(state.song);
      setIsPlaying(state.isPlaying);
      setProgress(state.currentTime);
    };

    const onSyncPulse = (pulse) => {
      const curVid = currentSong?.videoId || currentSong?.id;
      if (pulse.song_id !== curVid) {
        console.warn('[AntiGravity] Pulse song mismatch, loading:', pulse.song_id);
        updateCurrentSong({
          videoId: pulse.song_id,
          title: pulse.title,
          artist: pulse.artist,
          thumbnail: pulse.artwork_url,
        });
        return; // song load effect will handle the seek
      }

      // Update authoritative clock reference only — RAF engine handles correction
      _s.time = pulse.position_ms / 1000;
      _s.at = pulse.server_ts;
    };

    socket.on('sync-play', onSyncPlay);
    socket.on('sync-pause', onSyncPause);
    socket.on('sync-seek', onSyncSeek);
    socket.on('sync-progress', onSyncProgress);
    socket.on('sync_pulse', onSyncPulse);
    socket.on('sync-song', onSyncSong);
    socket.on('sync-state', onSyncState);

    return () => {
      socket.off('sync-play', onSyncPlay);
      socket.off('sync-pause', onSyncPause);
      socket.off('sync-seek', onSyncSeek);
      socket.off('sync-progress', onSyncProgress);
      socket.off('sync_pulse', onSyncPulse);
      socket.off('sync-song', onSyncSong);
      socket.off('sync-state', onSyncState);
    };
  }, [socket, currentSong?.videoId, currentSong?.id]);

  // ── MediaSession ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'LoopLobby Sync',
        album: 'LoopLobby',
        artwork: [{ src: currentSong.thumbnail, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      const posIv = setInterval(() => {
        if (!_p.ref || !('setPositionState' in navigator.mediaSession)) return;
        try {
          const duration = _p.ref.getDuration();
          const currentTime = _p.ref.getCurrentTime();
          if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
            navigator.mediaSession.setPositionState({
              duration,
              playbackRate: _p.ref.getPlaybackRate() || 1,
              position: currentTime,
            });
          }
        } catch (e) {}
      }, 2000);

      navigator.mediaSession.setActionHandler('play', () => {
        audioEngine.play();
        setIsPlaying(true);
        socket?.emit('play', { roomId, currentTime: _p.ref?.getCurrentTime() || 0 });
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioEngine.pause();
        setIsPlaying(false);
        socket?.emit('pause', { roomId, currentTime: _p.ref?.getCurrentTime() || 0 });
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        audioEngine.seek(0);
        socket?.emit('seek', { roomId, currentTime: 0 });
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          audioEngine.seek(details.seekTime);
          socket?.emit('seek', { roomId, currentTime: details.seekTime });
        }
      });

      return () => clearInterval(posIv);
    } catch (e) {
      console.error('MediaSession error:', e);
    }
  }, [currentSong?.videoId, isPlaying, queue?.length, socket, roomId]);

  // ── Visibility / background resume ─────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current && _p.ref) {
        const state = _p.ref.getPlayerState();
        if (state !== 1 && state !== 3) {
          console.log('[GlobalPlayer] Background resume — resyncing...');
          const expected = expectedTime(isPlayingRef);
          lockSeek();
          _p.ref.seekTo(expected, true);
          _p.ref.playVideo();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── YouTube callbacks ───────────────────────────────────────────────────────
  const onPlayerReady = useCallback((event) => {
    _p.ref = event.target;
    _p.ref.mute();
    _p.ref.setVolume(0);

    const vid = currentSong?.videoId || currentSong?.id;
    if (vid) {
      const startAt = _s.at > 0 ? Math.max(0, expectedTime(isPlayingRef)) : 0;
      _p.ref.loadVideoById({ videoId: vid, startSeconds: startAt });
    }

    try {
      const dur = _p.ref.getDuration();
      if (dur > 0) setDuration(dur * 1000);
    } catch (_) {}

    if (isPlayingRef.current) {
      _p.ref.playVideo();
      if (_started) {
        setTimeout(() => {
          try {
            _p.ref?.unMute();
            _p.ref?.setVolume(volumeRef.current * 100);
          } catch (_) {}
        }, 300);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStateChange = useCallback((e) => {
    // GUARD: Only block non-essential state changes during internal seeking.
    // We MUST allow "PLAYING" (1) to pass through so the engine knows it's active.
    if (_internalSeek && e.data !== 1) return;
    if (e.data === 1) _internalSeek = false; // Release lock immediately on play

    if (e.data === 1) {
      if (!isAudible && _started && !unmutedForCurrent.current) {
        try {
          _p.ref.unMute();
          _p.ref.setVolume(volumeRef.current * 100);
          setIsAudible(true);
          unmutedForCurrent.current = true;
        } catch (err) {}
      }
      setIsPlaying(true);
    }

    if (e.data === 2 && !isPlayingRef.current) {
      setIsPlaying(false);
    }
  }, [isAudible, setIsPlaying, setIsAudible]);

  const onEnd = useCallback(() => {
    socket?.emit('change-song', { roomId, song: queue?.[0] || null });
  }, [queue, socket, roomId]);

  const playerOpts = React.useMemo(() => ({
    width: '1',
    height: '1',
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      playsinline: 1,
      fs: 0,
      modestbranding: 1,
      origin: window.location.origin,
      enablejsapi: 1,
    },
  }), []);

  // ── Preload next track ──────────────────────────────────────────────────────
  const nextSong = queue?.[0] || null;
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    if (!nextSong || !currentSong) { setShouldPreload(false); return; }
    const iv = setInterval(() => {
      try {
        const dur = _p.ref?.getDuration() || 0;
        const cur = _p.ref?.getCurrentTime() || 0;
        if (dur > 0 && dur - cur <= 12) {
          setShouldPreload(true);
          clearInterval(iv);
        }
      } catch (_) {}
    }, 1000);
    return () => clearInterval(iv);
  }, [currentSong?.videoId, nextSong?.videoId]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!currentSong) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', bottom: 0, left: 0,
        width: 1, height: 1, opacity: 0.01,
        overflow: 'hidden', pointerEvents: 'none',
      }}
    >
      <YouTube
        videoId={currentSong?.videoId || currentSong?.id}
        opts={playerOpts}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        onEnd={onEnd}
        onError={(e) => {
          console.error('YouTube Player Error:', e.data);
          if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
        }}
      />
      {shouldPreload && nextSong && (
        <YouTube
          videoId={nextSong.videoId || nextSong.id}
          opts={{ ...playerOpts, playerVars: { ...playerOpts.playerVars, autoplay: 0 } }}
          onReady={(e) => e.target.mute()}
        />
      )}
    </div>
  );
}
