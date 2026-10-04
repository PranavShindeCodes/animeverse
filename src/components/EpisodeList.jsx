import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Sparkles } from 'lucide-react';

export const EpisodeList = ({ 
  animeId, 
  seasonNumber, 
  episodes = [], 
  currentPlayingEp = null,
  fallbackPoster = ''
}) => {
  const navigate = useNavigate();

  if (!episodes || episodes.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No episodes available for this season.
      </div>
    );
  }

  return (
    <div className="episodes-grid">
      {episodes.map((ep) => {
        const isCurrentPlaying = currentPlayingEp !== null && Number(currentPlayingEp) === Number(ep.episode);
        const epImg = ep.thumbnail || fallbackPoster;
        const formattedEpNum = String(ep.episode).padStart(2, '0');

        return (
          <div
            key={`ep-${ep.episode}`}
            className={`episode-card ${isCurrentPlaying ? 'active' : ''}`}
            onClick={() => navigate(`/watch/${animeId}/${seasonNumber}/${ep.episode}`)}
            role="button"
            tabIndex={0}
            aria-label={`Play Episode ${ep.episode}: ${ep.title}`}
          >
            <div className="ep-thumbnail-box">
              <img src={epImg} alt={`Episode ${ep.episode} thumbnail`} loading="lazy" />
              
              <div className="ep-play-overlay">
                <div className="ep-play-badge">
                  <Play size={18} fill="#ffffff" style={{ marginLeft: '2px' }} />
                </div>
              </div>

              {ep.duration && (
                <div className="ep-duration-badge">
                  <Clock size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  {ep.duration}
                </div>
              )}

              {isCurrentPlaying && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '0.5rem', 
                    left: '0.5rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    background: 'var(--accent-purple)', 
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: '0 0 10px var(--accent-purple-glow)'
                  }}
                >
                  <Sparkles size={11} />
                  <span>PLAYING</span>
                </div>
              )}
            </div>

            <div className="ep-content">
              <span className="ep-number">EPISODE {formattedEpNum}</span>
              <h4 className="ep-title" title={ep.title}>{ep.title}</h4>
              {ep.description && (
                <p className="ep-desc">{ep.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
