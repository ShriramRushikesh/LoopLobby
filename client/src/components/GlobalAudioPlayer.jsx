import React, { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';

// Singleton refs outside React lifecycle — never recreated
const _playerRef = { current: null };
const _syncData = { currentTime: 0, updatedAt: 0, serverOffset: 0 };
let _rafId = null;
let _isPlaying = false;
let _currentSongId = null;

// Internal RAF loop — runs 60fps but NEVER calls React setState
function startSyncLoop() {
  if (_rafId) cancelAnimationFrame(_rafId);
  
  function loop() {
    const player = _playerRef.current;
    if (player && _isPlaying && _syncData.updatedAt > 0) {
      const now = Date.now() + _syncData.serverOffset;
      const expectedTime = _syncData.currentTime + (now - _syncData.updatedAt) / 1000;
      try {
        const actualTime = player.getCurrentTime();
        if (Math.abs(expectedTime - actualTime) > 0.1) {
          player.seekTo(expectedTime, true);
        }
      } catch (e) { /* player not ready yet */ }
    }
    _rafId = requestAnimationFrame(loop);
  }
  _rafId = requestAnimationFrame(loop);
}

// Progress is reported to Zustand only once per second (not 60x/sec)
let _progressInterval = null;
function startProgressReporting(setProgress) {
  if (_progressInterval) clearInterval(_progressInterval);
  _progressInterval = setInterval(() => {
    if (_playerRef.current && _isPlaying) {
      try {
        setProgress(_playerRef.current.getCurrentTime());
      } catch (e) {}
    }
  }, 1000);
}

/**
 * GlobalAudioPlayer: Audio engine that runs outside React lifecycle.
 * React lifecycle only handles initialization — sync runs in a pure JS loop.
 */
export default function GlobalAudioPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    setProgress,
    setIsPlaying,
    setCurrentSong,
    setLatency,
    socket,
    room,
    queue,
  } = useRoomStore();

  const roomId = room?.id || room?.roomId;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Keep module-level vars in sync with Zustand state (no re-renders caused)
  _isPlaying = isPlaying;

  // Start the sync loop and progress reporter once on mount — never restart
  useEffect(() => {
    startSyncLoop();
    startProgressReporting(setProgress);
    return () => {
      if (_rafId) cancelAnimationFrame(_rafId);
      if (_progressInterval) clearInterval(_progressInterval);
    };
  }, []); // Empty deps — runs once only

  // 1. Latency Measurement (Ping-Pong)
  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => socket.emit('ping-sync', Date.now()), 5000);
    const onPong = ({ timestamp, serverTime }) => {
      const now = Date.now();
      const rtt = now - timestamp;
      _syncData.serverOffset = serverTime - (now - rtt / 2);
      setLatency(rtt);
    };
    socket.on('pong-sync', onPong);
    return () => {
      clearInterval(interval);
      socket.off('pong-sync', onPong);
    };
  }, [socket]);

  // 2. Socket Sync Listeners — update module-level data directly (no re-render)
  useEffect(() => {
    if (!socket) return;

    const onSyncPlay = ({ currentTime, updatedAt }) => {
      _syncData.currentTime = currentTime;
      _syncData.updatedAt = updatedAt;
      _isPlaying = true;
      setIsPlaying(true);
    };

    const onSyncPause = ({ currentTime, updatedAt }) => {
      _syncData.currentTime = currentTime;
      _syncData.updatedAt = updatedAt;
      _isPlaying = false;
      setIsPlaying(false);
    };

    const onSyncSeek = ({ currentTime, updatedAt }) => {
      _syncData.currentTime = currentTime;
      _syncData.updatedAt = updatedAt;
      // RAF loop corrects audio automatically — no setState needed
    };

    const onSyncSong = (song) => {
      _syncData.currentTime = 0;
      _syncData.updatedAt = Date.now();
      _isPlaying = true;
      setCurrentSong(song);    // triggers YouTube to load new video
      setIsPlaying(true);
    };

    // Late join: arrive at the right second without pausing/restarting
    const onSyncState = (state) => {
      if (!state.song) return;
      const rtt = Date.now() - (state.serverTime || Date.now());
      _syncData.currentTime = state.currentTime + rtt / 2000; // pre-compensate RTT
      _syncData.updatedAt = Date.now();
      _isPlaying = state.isPlaying;
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

  // 3. MediaSession API (Background Controls) — only re-run when song changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist || 'RuRu Sync',
      artwork: [{ src: currentSong.thumbnail, sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      socket?.emit('play', { roomId, currentTime: _playerRef.current?.getCurrentTime() || 0 });
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      socket?.emit('pause', { roomId, currentTime: _playerRef.current?.getCurrentTime() || 0 });
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
    });
  }, [currentSong?.videoId]);  // only re-run on actual song change, not on every render

  // 4. Player event handlers (stable refs — never cause re-renders)
  const onPlayerReady = useCallback((event) => {
    _playerRef.current = event.target;
    _playerRef.current.setVolume(volumeRef.current * 100);
    // Instantly seek to corrected position when player is ready
    if (_syncData.updatedAt > 0) {
      const now = Date.now() + _syncData.serverOffset;
      _playerRef.current.seekTo(_syncData.currentTime + (now - _syncData.updatedAt) / 1000, true);
    }
  }, []); // stable ref

  const onStateChange = useCallback((event) => {
    if (event.data === 1 && !_isPlaying) setIsPlaying(true);
    if (event.data === 2 && _isPlaying) setIsPlaying(false);
  }, []);

  const onEnd = useCallback(() => {
    if (queue?.length > 0) socket?.emit('change-song', { roomId, song: queue[0] });
  }, [queue, socket, roomId]);

  // Always render the player container — even without a song (preloads the iframe)
  const nextSong = queue?.[0];

  return (
    <div className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0">
      {currentSong && (
        <YouTube
          key={currentSong.videoId || currentSong.id}
          videoId={currentSong.videoId || currentSong.id}
          opts={{ playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 } }}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onEnd={onEnd}
        />
      )}
      {nextSong && (
        <YouTube
          key={`preload-${nextSong.videoId || nextSong.id}`}
          videoId={nextSong.videoId || nextSong.id}
          opts={{ playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 } }}
        />
      )}
    </div>
  );
}
