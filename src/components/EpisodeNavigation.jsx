import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { useRemoteSession } from '../context/RemoteSessionContext';

export const EpisodeNavigation = ({ animeId, prevEp, nextEp }) => {
  const navigate = useNavigate();
  const { openModal, isRemoteConnected } = useRemoteSession();

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '0.75rem',
        margin: '1.25rem 0',
        flexWrap: 'wrap'
      }}
    >
      {/* Previous Button */}
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!prevEp}
        onClick={() => {
          if (prevEp) {
            navigate(`/watch/${animeId}/${prevEp.season}/${prevEp.episode}`);
          }
        }}
        aria-label={prevEp ? `Go to previous episode: S${prevEp.season} E${prevEp.episode}` : 'No previous episode'}
      >
        <ChevronLeft size={18} />
        <span>
          {prevEp ? `Prev: S${prevEp.season} E${prevEp.episode}` : 'First Episode'}
        </span>
      </button>

      {/* Center Phone Remote Button */}
      <button
        type="button"
        className="btn btn-secondary btn-glow"
        onClick={openModal}
        style={{
          border: isRemoteConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-accent)',
          background: isRemoteConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.12)'
        }}
        title="Open Phone Remote QR Code"
        aria-label="Connect Phone Remote"
      >
        <Smartphone size={17} color={isRemoteConnected ? '#10b981' : 'var(--accent-purple)'} />
        <span>📱 Remote</span>
        {isRemoteConnected && (
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
        )}
      </button>

      {/* Next Button */}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!nextEp}
        onClick={() => {
          if (nextEp) {
            navigate(`/watch/${animeId}/${nextEp.season}/${nextEp.episode}`);
          }
        }}
        aria-label={nextEp ? `Go to next episode: S${nextEp.season} E${nextEp.episode}` : 'No next episode'}
      >
        <span>
          {nextEp ? `Next: S${nextEp.season} E${nextEp.episode}` : 'Final Episode'}
        </span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
