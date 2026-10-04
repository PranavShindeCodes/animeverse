import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Settings, 
  Tv, 
  Sparkles,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { saveWatchProgress, getStoredVolume, setStoredVolume } from '../utils/storage';
import { useRemoteSession } from '../context/RemoteSessionContext';

export const VideoPlayer = ({
  anime,
  seasonNumber,
  episode,
  nextEpisode = null,
  onPlayNext = null
}) => {
  const { broadcastPlayerState, registerCommandListener } = useRemoteSession();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(() => getStoredVolume());
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Helper to send sync state to remote phone
  const syncRemoteState = useCallback((overrides = {}) => {
    if (!anime || !episode) return;
    broadcastPlayerState({
      animeId: anime.id,
      animeName: anime.name,
      animeThumbnail: anime.thumbnail,
      season: Number(seasonNumber),
      episode: Number(episode.episode),
      episodeTitle: episode.title,
      playing: overrides.playing !== undefined ? overrides.playing : isPlaying,
      currentTime: overrides.currentTime !== undefined ? overrides.currentTime : (videoRef.current?.currentTime || currentTime),
      duration: overrides.duration !== undefined ? overrides.duration : (videoRef.current?.duration || duration),
      volume: isMuted ? 0 : (overrides.volume !== undefined ? overrides.volume : volume),
      muted: overrides.muted !== undefined ? overrides.muted : isMuted
    });
  }, [anime, episode, seasonNumber, isPlaying, currentTime, duration, volume, isMuted, broadcastPlayerState]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Synchronize volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
    syncRemoteState();
  }, [volume, isMuted, syncRemoteState]);

  // Reset states when episode changes
  useEffect(() => {
    setHasEnded(false);
    setVideoError(false);
    setCurrentTime(0);
    setBuffered(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.load();
      // Auto play when navigating episodes
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            syncRemoteState({ playing: true, currentTime: 0 });
          })
          .catch(() => {
            setIsPlaying(false);
            syncRemoteState({ playing: false, currentTime: 0 });
          });
      }
    }
  }, [episode?.videoUrl, seasonNumber, episode?.episode]);

  // Auto-hide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
      setShowSpeedMenu(false);
    }
  };

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasEnded(false);
          syncRemoteState({ playing: true });
        })
        .catch((err) => console.log('Play interrupted:', err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      syncRemoteState({ playing: false });
    }
  }, [syncRemoteState]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else if (containerRef.current.webkitRequestFullscreen) {
          containerRef.current.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen request error:', e);
    }
  }, []);

  // Time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);

    // Calculate buffer progress
    if (videoRef.current.buffered.length > 0 && dur > 0) {
      const buffEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((buffEnd / dur) * 100);
    }

    // Save watch progress & sync with remote every 3-5 seconds
    if (Math.floor(cur) % 3 === 0 && anime && episode) {
      saveWatchProgress({
        animeId: anime.id,
        animeName: anime.name,
        animeThumbnail: anime.thumbnail,
        season: seasonNumber,
        episode: episode.episode,
        episodeTitle: episode.title,
        currentTime: cur,
        duration: dur
      });
      syncRemoteState({ currentTime: cur, duration: dur });
    }
  };

  // Seek handler
  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pos * duration, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    syncRemoteState({ currentTime: newTime });
  };

  // Skip time forward / backward
  const handleSkip = useCallback((seconds) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || duration || 0;
    const target = Math.max(0, Math.min(videoRef.current.currentTime + seconds, dur));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    syncRemoteState({ currentTime: target });
  }, [duration, syncRemoteState]);

  // Volume change
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setStoredVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
    syncRemoteState({ volume: val, muted: false });
  };

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const nv = !prev;
      syncRemoteState({ muted: nv });
      return nv;
    });
  }, [syncRemoteState]);

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Change Playback Speed
  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  // Handle remote commands directly from phone
  useEffect(() => {
    const unregister = registerCommandListener((cmd) => {
      if (!cmd || !cmd.action) return;

      switch (cmd.action) {
        case 'PLAY':
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setHasEnded(false);
                syncRemoteState({ playing: true });
              })
              .catch(() => {});
          }
          break;
        case 'PAUSE':
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
            syncRemoteState({ playing: false });
          }
          break;
        case 'TOGGLE_PLAY':
          togglePlay();
          break;
        case 'SEEK':
          handleSkip(cmd.seconds || 0);
          break;
        case 'SET_VOLUME':
          if (typeof cmd.value === 'number') {
            const v = Math.max(0, Math.min(1, cmd.value));
            setVolume(v);
            setStoredVolume(v);
            setIsMuted(false);
            if (videoRef.current) videoRef.current.volume = v;
            syncRemoteState({ volume: v, muted: false });
          }
          break;
        case 'TOGGLE_MUTE':
          toggleMute();
          break;
        case 'FULLSCREEN':
          toggleFullscreen();
          break;
        default:
          break;
      }
    });

    return unregister;
  }, [registerCommandListener, togglePlay, handleSkip, toggleMute, toggleFullscreen, syncRemoteState]);

  // Track fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => {
            const nv = Math.min(1, Math.round((prev + 0.1) * 10) / 10);
            setStoredVolume(nv);
            return nv;
          });
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => {
            const nv = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
            setStoredVolume(nv);
            return nv;
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, handleSkip]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`video-player-container ${showControls ? 'show-controls' : ''} ${!isPlaying ? 'paused' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* HTML5 Native Video */}
      <video
        ref={videoRef}
        src={episode?.videoUrl}
        className="video-player-element"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            const d = videoRef.current.duration || 0;
            setDuration(d);
            syncRemoteState({ duration: d });
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          syncRemoteState({ playing: true });
        }}
        onPause={() => {
          setIsPlaying(false);
          syncRemoteState({ playing: false });
        }}
        onEnded={() => {
          setIsPlaying(false);
          setHasEnded(true);
          setShowControls(true);
          syncRemoteState({ playing: false, currentTime: duration });
        }}
        onError={() => setVideoError(true)}
        playsInline
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 15 }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Video Error Overlay */}
      {videoError && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8, 9, 13, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', zIndex: 35 }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Unable to Stream Video</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
            We encountered an error loading this episode stream. Please check your network or try again.
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setVideoError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
          >
            <RotateCw size={16} />
            <span>Retry Stream</span>
          </button>
        </div>
      )}

      {/* Center Play/Pause Indicator on paused state */}
      {!isPlaying && !hasEnded && !videoError && (
        <button
          type="button"
          className="video-center-btn"
          onClick={togglePlay}
          aria-label="Play Episode"
        >
          <Play size={28} fill="#ffffff" style={{ marginLeft: '4px' }} />
        </button>
      )}

      {/* Episode Finished Overlay */}
      {hasEnded && nextEpisode && (
        <div className="episode-finished-modal">
          <div className="finished-card">
            <div style={{ display: 'inline-flex', padding: '0.6rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', marginBottom: '1rem' }}>
              <Sparkles size={28} />
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Episode Finished</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Up Next: <strong>Season {nextEpisode.season} Episode {nextEpisode.episode}</strong> — {nextEpisode.data?.title || `Episode ${nextEpisode.episode}`}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-glow"
                onClick={() => {
                  setHasEnded(false);
                  if (onPlayNext) onPlayNext();
                }}
              >
                <PlayCircle size={18} />
                <span>Play Next Episode</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setHasEnded(false);
                  }
                }}
              >
                <RotateCcw size={16} />
                <span>Replay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div className="video-controls-overlay">
        {/* Top bar */}
        <div className="video-top-bar">
          <div className="video-title-text">
            <span>{anime?.name}</span>
            <span style={{ color: 'var(--accent-purple)', margin: '0 0.5rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>S{seasonNumber} E{episode?.episode}: {episode?.title}</span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="video-bottom-bar">
          {/* Progress / Seek bar */}
          <div 
            className="video-seek-container" 
            onClick={handleSeek}
            role="slider"
            aria-label="Seek time"
            aria-valuemin="0"
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            <div className="video-buffer-fill" style={{ width: `${buffered}%` }} />
            <div className="video-progress-fill" style={{ width: `${progressPercent}%` }} />
            <div className="video-seek-thumb" style={{ left: `${progressPercent}%` }} />
          </div>

          {/* Controls row */}
          <div className="video-controls-row">
            {/* Left Controls */}
            <div className="video-controls-left">
              <button 
                type="button" 
                className="video-control-btn" 
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} fill="#ffffff" />}
              </button>

              <button 
                type="button" 
                className="video-control-btn" 
                onClick={() => handleSkip(-10)}
                aria-label="Rewind 10 seconds"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw size={18} />
              </button>

              <button 
                type="button" 
                className="video-control-btn" 
                onClick={() => handleSkip(10)}
                aria-label="Forward 10 seconds"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw size={18} />
              </button>

              <div className="volume-container">
                <button 
                  type="button" 
                  className="video-control-btn" 
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={19} />
                  ) : volume < 0.5 ? (
                    <Volume1 size={19} />
                  ) : (
                    <Volume2 size={19} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  aria-label="Volume slider"
                />
              </div>

              <div className="video-time-display">
                <span>{formatTime(currentTime)}</span>
                <span style={{ margin: '0 0.35rem', color: 'var(--text-dim)' }}>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="video-controls-right">
              {/* Speed Settings */}
              <div className="speed-dropdown">
                <button
                  type="button"
                  className="video-control-btn"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  style={{ fontSize: '0.85rem', fontWeight: 700 }}
                  aria-label="Playback speed"
                  title="Playback Speed"
                >
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="speed-menu">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                        onClick={() => handleSpeedChange(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              {document.pictureInPictureEnabled && (
                <button 
                  type="button" 
                  className="video-control-btn" 
                  onClick={togglePiP}
                  aria-label="Picture in Picture"
                  title="Picture in Picture"
                >
                  <Tv size={18} />
                </button>
              )}

              {/* Fullscreen */}
              <button 
                type="button" 
                className="video-control-btn" 
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
