import React from 'react';

export const AnimeCardSkeleton = () => {
  return (
    <div className="anime-card" style={{ pointerEvents: 'none' }}>
      <div className="card-poster-wrapper skeleton" />
      <div className="card-details" style={{ gap: '0.6rem' }}>
        <div className="skeleton" style={{ height: '16px', width: '80%' }} />
        <div className="skeleton" style={{ height: '12px', width: '55%' }} />
        <div className="skeleton" style={{ height: '12px', width: '40%', marginTop: '0.4rem' }} />
      </div>
    </div>
  );
};

export const AnimeGridSkeleton = ({ count = 10 }) => {
  return (
    <div className="anime-grid">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="hero-wrapper" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ width: '100%' }}>
        <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ width: '180px', height: '28px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ width: '70%', height: '48px' }} />
          <div className="skeleton" style={{ width: '50%', height: '24px' }} />
          <div className="skeleton" style={{ width: '90%', height: '70px' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
