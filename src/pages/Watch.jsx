import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getAnimeById, 
  getSeason, 
  getEpisode, 
  getNextEpisode, 
  getPrevEpisode, 
  getAllAnime 
} from '../utils/animeData';
import { VideoPlayer } from '../components/VideoPlayer';
import { EpisodeNavigation } from '../components/EpisodeNavigation';
import { SeasonSelector } from '../components/SeasonSelector';
import { AnimeCard } from '../components/AnimeCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useRemoteSession } from '../context/RemoteSessionContext';
import { 
  Play, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  Clock, 
  Tv, 
  Info,
  ChevronRight,
  Smartphone
} from 'lucide-react';

export const Watch = () => {
  const { animeId, season: seasonParam, episode: epParam } = useParams();
  const navigate = useNavigate();
  const { registerCommandListener, openModal, isRemoteConnected } = useRemoteSession();

  const seasonNum = Number(seasonParam) || 1;
  const epNum = Number(epParam) || 1;

  const anime = getAnimeById(animeId);
  const currentSeason = getSeason(animeId, seasonNum);
  const currentEpisode = getEpisode(animeId, seasonNum, epNum);
  const nextEp = getNextEpisode(animeId, seasonNum, epNum);
  const prevEp = getPrevEpisode(animeId, seasonNum, epNum);

  // Store refs to latest computed navigation targets so socket listener always accesses fresh state
  const nextEpRef = useRef(nextEp);
  const prevEpRef = useRef(prevEp);
  const animeIdRef = useRef(animeId);

  useEffect(() => {
    nextEpRef.current = nextEp;
    prevEpRef.current = prevEp;
    animeIdRef.current = animeId;
  }, [nextEp, prevEp, animeId]);

  // Handle remote episode change commands from phone
  useEffect(() => {
    const unregister = registerCommandListener((cmd) => {
      if (!cmd || !cmd.action) return;

      if (cmd.action === 'NEXT_EPISODE' && nextEpRef.current) {
        navigate(`/watch/${animeIdRef.current}/${nextEpRef.current.season}/${nextEpRef.current.episode}`);
      } else if (cmd.action === 'PREVIOUS_EPISODE' && prevEpRef.current) {
        navigate(`/watch/${animeIdRef.current}/${prevEpRef.current.season}/${prevEpRef.current.episode}`);
      } else if (cmd.action === 'SELECT_EPISODE') {
        const targetAnime = cmd.animeId || animeIdRef.current;
        navigate(`/watch/${targetAnime}/${cmd.season}/${cmd.episode}`);
      }
    });

    return unregister;
  }, [registerCommandListener, navigate]);

  // Dynamic document title
  const pageTitle = anime && currentEpisode 
    ? `${anime.name} — S${seasonNum} E${epNum}: ${currentEpisode.title}`
    : 'Watch Episode';
  useDocumentTitle(pageTitle);

  // Scroll to top on episode change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [animeId, seasonParam, epParam]);

  // Handle errors gracefully if anime, season, or episode is invalid
  if (!anime) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={56} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Anime Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          The requested anime series could not be found.
        </p>
        <Link to="/anime" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Browse Anime</span>
        </Link>
      </div>
    );
  }

  if (!currentSeason || !currentEpisode) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={56} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Oops! Episode Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          We couldn't find Season {seasonNum}, Episode {epNum} for {anime.name}.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={`/anime/${anime.id}`} className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Back to {anime.name}</span>
          </Link>
          <Link to="/anime" className="btn btn-secondary">
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // Related anime recommendations (same genres, excluding current)
  const relatedAnime = getAllAnime()
    .filter(a => a.id !== anime.id && a.genres?.some(g => anime.genres?.includes(g)))
    .slice(0, 4);

  const handlePlayNext = () => {
    if (nextEp) {
      navigate(`/watch/${anime.id}/${nextEp.season}/${nextEp.episode}`);
    }
  };

  const handleSeasonChange = (newSeasonNum) => {
    const targetSeason = getSeason(anime.id, newSeasonNum);
    const firstEp = targetSeason?.episodes?.[0]?.episode || 1;
    navigate(`/watch/${anime.id}/${newSeasonNum}/${firstEp}`);
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Breadcrumb Navigation & Remote Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/anime" style={{ color: 'var(--text-muted)' }}>Anime</Link>
          <ChevronRight size={14} />
          <Link to={`/anime/${anime.id}`} style={{ color: 'var(--text-muted)' }}>{anime.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Season {seasonNum} Ep {epNum}</span>
        </div>

        {/* Top Mini Remote Trigger Button */}
        <button
          type="button"
          onClick={openModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            background: isRemoteConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isRemoteConnected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
            fontSize: '0.8rem',
            color: isRemoteConnected ? '#6ee7b7' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <Smartphone size={14} color={isRemoteConnected ? '#10b981' : 'var(--accent-purple)'} />
          <span>{isRemoteConnected ? '● Phone Connected' : '📱 Pair Remote'}</span>
        </button>
      </div>

      {/* Main Watch Layout */}
      <div className="watch-layout">
        {/* Left Column: Player & Episode Details */}
        <div>
          {/* High-End Video Player */}
          <VideoPlayer
            anime={anime}
            seasonNumber={seasonNum}
            episode={currentEpisode}
            nextEpisode={nextEp}
            onPlayNext={handlePlayNext}
          />

          {/* Episode Navigation Buttons (Prev / 📱 Remote / Next) */}
          <EpisodeNavigation
            animeId={anime.id}
            prevEp={prevEp}
            nextEp={nextEp}
          />

          {/* Episode Info Card */}
          <div 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '16px', 
              padding: '1.5rem',
              marginTop: '1.5rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
                  SEASON {seasonNum} • EPISODE {epNum}
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentEpisode.title}</h1>
              </div>

              <Link 
                to={`/anime/${anime.id}`}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <Info size={15} />
                <span>Show Info</span>
              </Link>
            </div>

            {currentEpisode.description && (
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                {currentEpisode.description}
              </p>
            )}

            {/* Anime Metadata pill tags */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="badge badge-glass">{anime.name}</span>
              <span className="badge badge-glass">{anime.releaseYear}</span>
              {anime.quality && <span className="badge badge-glass">{anime.quality}</span>}
              {anime.studio && <span className="badge badge-glass">{anime.studio}</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Season Selector & Episodes Sidebar */}
        <div>
          <div className="watch-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--accent-purple)" />
                <span>Episodes</span>
              </h3>
              
              <SeasonSelector
                seasons={anime.seasons || []}
                selectedSeasonNum={seasonNum}
                onSelectSeason={handleSeasonChange}
              />
            </div>

            {/* List of episodes in current season */}
            <div className="sidebar-episodes-list">
              {currentSeason.episodes?.map((ep) => {
                const isActive = Number(ep.episode) === epNum;
                const formattedNum = String(ep.episode).padStart(2, '0');

                return (
                  <div
                    key={`sidebar-ep-${ep.episode}`}
                    className={`sidebar-ep-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(`/watch/${anime.id}/${seasonNum}/${ep.episode}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="sidebar-ep-num">{formattedNum}</span>
                    <span className="sidebar-ep-title" title={ep.title}>{ep.title}</span>
                    {isActive ? (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>NOW</span>
                    ) : (
                      <Play size={14} color="var(--text-dim)" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended / More Like This */}
      {relatedAnime.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <Sparkles size={20} color="var(--accent-purple)" />
              <span>More Like This</span>
            </h2>
          </div>
          <div className="anime-grid">
            {relatedAnime.map((rec) => (
              <AnimeCard key={rec.id} anime={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
