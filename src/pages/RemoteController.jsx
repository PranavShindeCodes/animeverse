import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createSocketConnection } from '../utils/socket';
import { getAnimeById } from '../utils/animeData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Smartphone,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCw as RefreshIcon,
  CheckCircle2,
  Tv,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Home as HomeIcon,
  Compass
} from 'lucide-react';

export const RemoteController = () => {
  const { sessionId: rawSessionId } = useParams();
  const sessionId = rawSessionId ? rawSessionId.trim().toUpperCase() : '';
  useDocumentTitle(`Remote [${sessionId}] — AnimeVerse`);

  // Connection states
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'invalid' | 'busy'
  const [errorMessage, setErrorMessage] = useState('');
  const [fullscreenNotice, setFullscreenNotice] = useState('');

  // Player state synchronized from laptop
  const [playerState, setPlayerState] = useState({
    animeId: '',
    animeName: 'No anime loaded',
    animeThumbnail: '',
    season: 1,
    episode: 1,
    episodeTitle: '',
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    muted: false
  });

  // Episode browser state on phone
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showEpisodeSheet, setShowEpisodeSheet] = useState(false);

  const socketRef = useRef(null);

  // Optional haptic vibration on mobile
  const vibrate = (ms = 35) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  };

  // Connect socket and register remote
  const connectToSession = useCallback(() => {
    setConnectionStatus('connecting');
    setErrorMessage('');

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = createSocketConnection();
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit('register-remote', { sessionId });
    };

    const handleRemoteRegistered = ({ lastState }) => {
      setConnectionStatus('connected');
      if (lastState) {
        setPlayerState(prev => ({ ...prev, ...lastState }));
        if (lastState.season) setSelectedSeason(Number(lastState.season));
      }
    };

    const handlePlayerState = (state) => {
      setConnectionStatus('connected');
      setPlayerState(prev => ({ ...prev, ...state }));
      if (state.season) setSelectedSeason(Number(state.season));
    };

    const handleLaptopConnected = () => {
      setConnectionStatus('connected');
      socket.emit('request-player-state', { sessionId });
    };

    const handleErrorInvalidSession = ({ message }) => {
      setConnectionStatus('invalid');
      setErrorMessage(message || 'This remote session is invalid or expired.');
    };

    const handleErrorSessionBusy = ({ message }) => {
      setConnectionStatus('busy');
      setErrorMessage(message || 'This session already has a remote connected.');
    };

    const handleLaptopDisconnected = () => {
      setConnectionStatus('disconnected');
      setErrorMessage('Waiting for laptop to connect...');
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('remote-registered', handleRemoteRegistered);
    socket.on('player-state', handlePlayerState);
    socket.on('laptop-connected', handleLaptopConnected);
    socket.on('error-invalid-session', handleErrorInvalidSession);
    socket.on('error-session-busy', handleErrorSessionBusy);
    socket.on('laptop-disconnected', handleLaptopDisconnected);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('remote-registered', handleRemoteRegistered);
      socket.off('player-state', handlePlayerState);
      socket.off('laptop-connected', handleLaptopConnected);
      socket.off('error-invalid-session', handleErrorInvalidSession);
      socket.off('error-session-busy', handleErrorSessionBusy);
      socket.off('laptop-disconnected', handleLaptopDisconnected);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    const cleanup = connectToSession();
    return () => cleanup && cleanup();
  }, [connectToSession]);

  // Send structured command to laptop
  const sendCommand = (action, payload = {}) => {
    vibrate(35);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('remote-command', {
        sessionId,
        command: {
          action,
          ...payload
        }
      });
    }
  };

  // TV Navigation Handlers
  const handleNavUp = () => sendCommand('NAV_UP');
  const handleNavDown = () => sendCommand('NAV_DOWN');
  const handleNavLeft = () => sendCommand('NAV_LEFT');
  const handleNavRight = () => sendCommand('NAV_RIGHT');
  const handleNavOk = () => sendCommand('NAV_OK');
  const handleNavBack = () => sendCommand('NAV_BACK');
  const handleNavHome = () => sendCommand('NAV_HOME');

  // Playback Command handlers
  const handleTogglePlay = () => {
    const newPlaying = !playerState.playing;
    setPlayerState(prev => ({ ...prev, playing: newPlaying }));
    sendCommand('TOGGLE_PLAY');
  };

  const handleSeek = (seconds) => {
    sendCommand('SEEK', { seconds });
  };

  const handlePrevEpisode = () => {
    sendCommand('PREVIOUS_EPISODE');
  };

  const handleNextEpisode = () => {
    sendCommand('NEXT_EPISODE');
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setPlayerState(prev => ({ ...prev, volume: val, muted: false }));
    sendCommand('SET_VOLUME', { value: val });
  };

  const handleToggleMute = () => {
    const newMuted = !playerState.muted;
    setPlayerState(prev => ({ ...prev, muted: newMuted }));
    sendCommand('TOGGLE_MUTE');
  };

  const handleFullscreen = () => {
    sendCommand('FULLSCREEN');
    setFullscreenNotice('Fullscreen command sent to laptop!');
    setTimeout(() => setFullscreenNotice(''), 3500);
  };

  const handleSelectEpisode = (seasonNum, epNum) => {
    sendCommand('SELECT_EPISODE', {
      season: Number(seasonNum),
      episode: Number(epNum),
      animeId: playerState.animeId
    });
    setShowEpisodeSheet(false);
  };

  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Retrieve current anime full metadata from JSON for episode browsing
  const currentAnimeData = getAnimeById(playerState.animeId);
  const currentSeasonData = currentAnimeData?.seasons?.find(s => s.season === Number(selectedSeason)) || currentAnimeData?.seasons?.[0];

  const progressPercent = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  // Render Error / Disconnected Screens
  if (connectionStatus === 'invalid' || connectionStatus === 'busy') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '1.5rem' }}>
          <AlertTriangle size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Connection Failed</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '340px', marginBottom: '2rem' }}>
          {errorMessage || 'Unable to connect to this remote session.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={connectToSession} className="btn btn-secondary">
            <RefreshIcon size={16} />
            <span>Retry Connection</span>
          </button>
          <Link to="/" className="btn btn-primary">
            <span>Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#07070a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        maxWidth: '440px',
        margin: '0 auto',
        userSelect: 'none',
        position: 'relative',
        paddingBottom: '3rem'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="#ffffff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
            ANIME<span style={{ color: 'var(--accent-purple)' }}>REMOTE</span>
          </span>
        </div>

        {/* Live Status Pill */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.25rem 0.65rem', 
            borderRadius: '20px',
            background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            border: `1px solid ${connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
            fontSize: '0.72rem',
            fontWeight: 700
          }}
        >
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: connectionStatus === 'connected' ? '#10b981' : '#fbbf24',
              boxShadow: connectionStatus === 'connected' ? '0 0 8px #10b981' : '0 0 6px #fbbf24' 
            }} 
          />
          <span style={{ color: connectionStatus === 'connected' ? '#6ee7b7' : '#fcd34d' }}>
            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Disconnected / Reconnecting banner */}
      {connectionStatus !== 'connected' && (
        <div style={{ background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#fcd34d' }}>
            <WifiOff size={15} />
            <span>{errorMessage || 'Connecting to laptop...'}</span>
          </div>
          <button 
            type="button" 
            onClick={connectToSession}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#ffffff', background: 'var(--accent-purple)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}
          >
            <RefreshIcon size={11} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Fullscreen Feedback Notice */}
      {fullscreenNotice && (
        <div style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid var(--accent-purple)', borderRadius: '12px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#e9d5ff', animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle2 size={15} color="var(--accent-purple)" />
          <span>{fullscreenNotice}</span>
        </div>
      )}

      {/* Now Playing Mini Card */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: '16px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '1.25rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {playerState.animeThumbnail ? (
            <img 
              src={playerState.animeThumbnail} 
              alt={playerState.animeName}
              style={{ width: '48px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }} 
            />
          ) : (
            <div style={{ width: '48px', height: '64px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tv size={20} color="var(--text-dim)" />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Now Playing
            </div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {playerState.animeName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Season {playerState.season} • Episode {playerState.episode}
              {playerState.episodeTitle ? ` - ${playerState.episodeTitle}` : ''}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.3rem' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--grad-primary)', transition: 'width 0.25s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          TV NAVIGATION D-PAD SECTION
          ========================================================================== */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          TV Navigation
        </div>

        {/* Circular D-Pad */}
        <div className="dpad-container">
          {/* UP */}
          <button
            type="button"
            className="dpad-btn dpad-up"
            onClick={handleNavUp}
            aria-label="Navigate Up"
          >
            <ChevronUp size={28} />
          </button>

          {/* DOWN */}
          <button
            type="button"
            className="dpad-btn dpad-down"
            onClick={handleNavDown}
            aria-label="Navigate Down"
          >
            <ChevronDown size={28} />
          </button>

          {/* LEFT */}
          <button
            type="button"
            className="dpad-btn dpad-left"
            onClick={handleNavLeft}
            aria-label="Navigate Left"
          >
            <ChevronLeft size={28} />
          </button>

          {/* RIGHT */}
          <button
            type="button"
            className="dpad-btn dpad-right"
            onClick={handleNavRight}
            aria-label="Navigate Right"
          >
            <ChevronRight size={28} />
          </button>

          {/* CENTER OK BUTTON */}
          <button
            type="button"
            className="dpad-center-ok"
            onClick={handleNavOk}
            aria-label="OK / Select"
          >
            OK
          </button>
        </div>

        {/* Back and Home Action Row */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '240px', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNavBack}
            style={{ flex: 1, padding: '0.75rem 0.5rem', borderRadius: '12px', fontSize: '0.85rem' }}
            aria-label="Go Back"
          >
            <CornerDownLeft size={16} />
            <span>Back</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNavHome}
            style={{ flex: 1, padding: '0.75rem 0.5rem', borderRadius: '12px', fontSize: '0.85rem' }}
            aria-label="Go Home"
          >
            <HomeIcon size={16} color="var(--accent-purple)" />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* ==========================================================================
          PLAYBACK & VOLUME CONTROLS
          ========================================================================== */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        {/* Row 1: Prev, Big Play/Pause, Next */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={handlePrevEpisode}
            style={{ width: '50px', height: '50px', borderRadius: '14px' }}
            aria-label="Previous Episode"
          >
            <SkipBack size={20} />
          </button>

          {/* Big Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 25px var(--accent-purple-glow), 0 0 12px var(--accent-pink-glow)',
              transition: 'transform 0.15s ease'
            }}
            aria-label={playerState.playing ? 'Pause' : 'Play'}
          >
            {playerState.playing ? (
              <Pause size={32} fill="#ffffff" />
            ) : (
              <Play size={32} fill="#ffffff" style={{ marginLeft: '3px' }} />
            )}
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={handleNextEpisode}
            style={{ width: '50px', height: '50px', borderRadius: '14px' }}
            aria-label="Next Episode"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Row 2: 10s Skip Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSeek(-10)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <RotateCcw size={16} />
            <span>-10 Sec</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSeek(10)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <RotateCw size={16} />
            <span>+10 Sec</span>
          </button>
        </div>

        {/* Row 3: Volume Control */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.85rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            onClick={handleToggleMute}
            style={{ color: playerState.muted ? '#ef4444' : 'var(--accent-purple)', padding: '0.2rem' }}
            aria-label={playerState.muted ? 'Unmute' : 'Mute'}
          >
            {playerState.muted || playerState.volume === 0 ? (
              <VolumeX size={20} />
            ) : playerState.volume < 0.5 ? (
              <Volume1 size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={playerState.muted ? 0 : playerState.volume}
            onChange={handleVolumeChange}
            style={{ flex: 1, accentColor: 'var(--accent-purple)', height: '6px' }}
            aria-label="Volume Slider"
          />

          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', minWidth: '32px', textAlign: 'right', color: 'var(--text-muted)' }}>
            {playerState.muted ? '0%' : `${Math.round(playerState.volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Row 4: Season / Episode & Fullscreen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentAnimeData && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowEpisodeSheet(!showEpisodeSheet)}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '14px' }}
          >
            <Layers size={18} color="var(--accent-purple)" />
            <span>Select Season & Episode</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-primary btn-glow"
          onClick={handleFullscreen}
          style={{ width: '100%', padding: '0.85rem', borderRadius: '14px' }}
        >
          <Maximize size={18} />
          <span>Toggle Laptop Fullscreen</span>
        </button>
      </div>

      {/* Episode Selection Drawer / Sheet on Phone */}
      {showEpisodeSheet && currentAnimeData && (
        <div className="mobile-menu-overlay" onClick={() => setShowEpisodeSheet(false)} style={{ zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div 
            style={{
              width: '100%',
              maxHeight: '75vh',
              background: 'var(--bg-secondary)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              border: '1px solid var(--border-accent)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              animation: 'fadeInUp 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Choose Episode</h4>
              <button 
                type="button" 
                onClick={() => setShowEpisodeSheet(false)}
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
              >
                Close
              </button>
            </div>

            {/* Season tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {currentAnimeData.seasons?.map((s) => (
                <button
                  key={s.season}
                  type="button"
                  onClick={() => setSelectedSeason(s.season)}
                  className={`genre-pill ${selectedSeason === s.season ? 'active' : ''}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                >
                  Season {s.season}
                </button>
              ))}
            </div>

            {/* Episode List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
              {currentSeasonData?.episodes?.map((ep) => {
                const isCur = Number(playerState.season) === Number(selectedSeason) && Number(playerState.episode) === Number(ep.episode);
                return (
                  <button
                    key={ep.episode}
                    type="button"
                    onClick={() => handleSelectEpisode(selectedSeason, ep.episode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: isCur ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isCur ? 'var(--accent-purple)' : 'transparent'}`,
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
                        EPISODE {ep.episode}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff' }}>
                        {ep.title}
                      </div>
                    </div>
                    {isCur ? (
                      <span className="badge badge-purple">PLAYING</span>
                    ) : (
                      <Play size={16} color="var(--text-dim)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
