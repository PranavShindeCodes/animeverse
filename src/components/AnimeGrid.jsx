import React from 'react';
import { AnimeCard } from './AnimeCard';
import { Sparkles, SearchX } from 'lucide-react';

export const AnimeGrid = ({ animeList = [], title = '', emptyMessage = 'No anime found matching your criteria.' }) => {
  return (
    <div style={{ marginBottom: '3rem' }}>
      {title && (
        <div className="section-header">
          <h2 className="section-title">
            <Sparkles size={20} className="section-title-icon" />
            <span>{title}</span>
          </h2>
          <span className="badge badge-purple">
            {animeList.length} {animeList.length === 1 ? 'Anime' : 'Titles'}
          </span>
        </div>
      )}

      {animeList.length === 0 ? (
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '4rem 1.5rem', 
            background: 'var(--bg-card)', 
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            marginTop: '1rem'
          }}
        >
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(139, 92, 246, 0.12)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'var(--accent-purple)'
            }}
          >
            <SearchX size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Anime Found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', fontSize: '0.92rem' }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="anime-grid">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
};
