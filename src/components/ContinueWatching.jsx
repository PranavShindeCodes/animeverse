import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Play, Trash2, X } from 'lucide-react';
import { removeWatchHistory, clearWatchHistory } from '../utils/storage';

export const ContinueWatching = ({ history = [], onHistoryUpdated }) => {
  const navigate = useNavigate();

  if (!history || history.length === 0) {
    return null;
  }

  const handleRemove = (e, animeId) => {
    e.stopPropagation();
    const updated = removeWatchHistory(animeId);
    if (onHistoryUpdated) onHistoryUpdated(updated);
  };

  const handleClearAll = () => {
    clearWatchHistory();
    if (onHistoryUpdated) onHistoryUpdated([]);
  };

  const handleResume = (item) => {
    navigate(`/watch/${item.animeId}/${item.season}/${item.episode}`);
  };

  return (
    <section style={{ marginBottom: '3.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <History size={22} className="section-title-icon" />
          <span>Continue Watching</span>
        </h2>
        <button 
          type="button" 
          onClick={handleClearAll}
          style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-dim)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)'
          }}
          title="Clear all watch history"
        >
          <Trash2 size={13} />
          <span>Clear History</span>
        </button>
      </div>

      <div className="continue-grid">
        {history.map((item) => (
          <div 
            key={`${item.animeId}-s${item.season}e${item.episode}`}
            className="continue-card"
            onClick={() => handleResume(item)}
            role="button"
            tabIndex={0}
            aria-label={`Continue watching ${item.animeName} Season ${item.season} Episode ${item.episode}`}
          >
            <div className="continue-thumb">
              <img src={item.animeThumbnail} alt={item.animeName} />
              <div className="continue-progress-bar">
                <div 
                  className="continue-progress-fill" 
                  style={{ width: `${item.progressPercent || 0}%` }} 
                />
              </div>
            </div>

            <div className="continue-info">
              <h3 className="continue-anime-title">{item.animeName}</h3>
              <p className="continue-ep-title">
                S{item.season} E{item.episode}: {item.episodeTitle || `Episode ${item.episode}`}
              </p>
              <div className="continue-meta">
                <span>{item.progressPercent > 0 ? `${item.progressPercent}% Completed` : 'Resume'}</span>
              </div>
            </div>

            <button 
              type="button" 
              className="continue-remove-btn"
              onClick={(e) => handleRemove(e, item.animeId)}
              aria-label="Remove from continue watching"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
