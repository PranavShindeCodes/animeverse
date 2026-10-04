import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, Calendar, Layers, Tv } from 'lucide-react';

export const AnimeCard = ({ anime }) => {
  const navigate = useNavigate();
  if (!anime) return null;

  const firstSeason = anime.seasons?.[0]?.season || 1;
  const firstEpisode = anime.seasons?.[0]?.episodes?.[0]?.episode || 1;
  const seasonCount = anime.seasons?.length || 0;

  const handlePlayDirectly = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/watch/${anime.id}/${firstSeason}/${firstEpisode}`);
  };

  return (
    <div 
      className="anime-card" 
      onClick={() => navigate(`/anime/${anime.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/anime/${anime.id}`);
      }}
      aria-label={`View ${anime.name}`}
    >
      <div className="card-poster-wrapper">
        <img 
          src={anime.thumbnail || anime.banner} 
          alt={`${anime.name} poster`} 
          className="card-poster"
          loading="lazy"
        />
        
        {/* Hover overlay & Play Button */}
        <div className="card-poster-overlay" />
        <div className="card-play-overlay">
          <button 
            type="button" 
            className="card-play-btn"
            onClick={handlePlayDirectly}
            aria-label={`Watch ${anime.name} now`}
          >
            <Play size={22} fill="#ffffff" style={{ marginLeft: '2px' }} />
          </button>
        </div>

        {/* Top Badges */}
        <div className="card-top-badges">
          {anime.rating && (
            <span className="badge badge-gold badge-glass">
              <Star size={11} fill="#fcd34d" />
              {anime.rating}
            </span>
          )}
          <span className={`badge badge-glass ${anime.status === 'Completed' ? 'badge-emerald' : 'badge-cyan'}`}>
            {anime.status}
          </span>
        </div>

        {/* Bottom Season Pill */}
        <div className="card-bottom-info">
          {seasonCount > 0 && (
            <span className="badge badge-glass" style={{ fontSize: '0.7rem' }}>
              <Layers size={10} />
              {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
            </span>
          )}
          {anime.quality && (
            <span className="badge badge-glass" style={{ fontSize: '0.65rem' }}>
              {anime.quality.includes('4K') ? '4K' : 'HD'}
            </span>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="card-details">
        <h3 className="card-title" title={anime.name}>{anime.name}</h3>
        
        <p className="card-genres">
          {Array.isArray(anime.genres) ? anime.genres.join(' • ') : ''}
        </p>

        <div className="card-footer">
          <span>{anime.releaseYear}</span>
          {anime.studio && <span>{anime.studio}</span>}
        </div>
      </div>
    </div>
  );
};
