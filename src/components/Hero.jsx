import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info, Star, Calendar, Tv, Sparkles, Layers } from 'lucide-react';

export const Hero = ({ featuredAnimeList = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-slide every 8 seconds
  useEffect(() => {
    if (!featuredAnimeList.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredAnimeList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredAnimeList.length]);

  if (!featuredAnimeList || featuredAnimeList.length === 0) {
    return null;
  }

  const currentAnime = featuredAnimeList[currentIndex] || featuredAnimeList[0];
  const firstSeason = currentAnime?.seasons?.[0]?.season || 1;
  const firstEpisode = currentAnime?.seasons?.[0]?.episodes?.[0]?.episode || 1;

  return (
    <section className="hero-wrapper" aria-label="Featured Anime">
      {/* Background Banner */}
      <div className="hero-backdrop">
        <img 
          key={currentAnime.id}
          src={currentAnime.banner || currentAnime.thumbnail} 
          alt={`${currentAnime.name} Banner`} 
          loading="eager"
        />
        <div className="hero-overlay-desktop" />
        <div className="hero-overlay-bottom" />
      </div>

      <div className="container" style={{ width: '100%' }}>
        <div className="hero-content" key={currentAnime.id}>
          {/* Top highlight badge */}
          <div className="hero-tag">
            <Sparkles size={14} />
            <span>#1 Featured Anime of the Season</span>
          </div>

          {/* Title */}
          <h1 className="hero-title">{currentAnime.name}</h1>

          {/* Meta Information */}
          <div className="hero-meta">
            {currentAnime.rating && (
              <span className="badge badge-gold">
                <Star size={12} fill="#fcd34d" />
                {currentAnime.rating}
              </span>
            )}
            <span className="badge badge-purple">
              <Calendar size={12} />
              {currentAnime.releaseYear}
            </span>
            <span className={`badge ${currentAnime.status === 'Completed' ? 'badge-emerald' : 'badge-cyan'}`}>
              <Tv size={12} />
              {currentAnime.status}
            </span>
            {currentAnime.quality && (
              <span className="badge badge-glass">
                {currentAnime.quality}
              </span>
            )}
            {currentAnime.seasons?.length > 0 && (
              <span className="badge badge-glass">
                <Layers size={12} />
                {currentAnime.seasons.length} {currentAnime.seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
            )}
          </div>

          {/* Genres */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {currentAnime.genres?.map((genre) => (
              <span key={genre} className="badge badge-glass" style={{ fontSize: '0.7rem' }}>
                {genre}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="hero-description">{currentAnime.description}</p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <Link 
              to={`/watch/${currentAnime.id}/${firstSeason}/${firstEpisode}`}
              className="btn btn-primary btn-glow"
              aria-label={`Watch ${currentAnime.name} Episode 1 now`}
            >
              <Play size={18} fill="#ffffff" />
              <span>Watch Now</span>
            </Link>

            <Link 
              to={`/anime/${currentAnime.id}`}
              className="btn btn-secondary"
              aria-label={`View details for ${currentAnime.name}`}
            >
              <Info size={18} />
              <span>View Details</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {featuredAnimeList.length > 1 && (
        <div className="hero-indicators">
          {featuredAnimeList.map((anime, idx) => (
            <button
              key={anime.id}
              type="button"
              className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to featured slide ${idx + 1}: ${anime.name}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
