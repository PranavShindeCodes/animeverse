import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnimeById } from '../utils/animeData';
import { SeasonSelector } from '../components/SeasonSelector';
import { EpisodeList } from '../components/EpisodeList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { 
  Play, 
  Star, 
  Calendar, 
  Tv, 
  Layers, 
  Building, 
  Sparkles, 
  ArrowLeft,
  SearchX
} from 'lucide-react';

export const AnimeDetails = () => {
  const { animeId } = useParams();
  const navigate = useNavigate();
  const anime = getAnimeById(animeId);

  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    if (anime && anime.seasons && anime.seasons.length > 0) {
      setSelectedSeason(anime.seasons[0].season);
    }
  }, [animeId, anime]);

  useDocumentTitle(anime ? anime.name : 'Anime Not Found');

  // Error / Not Found state
  if (!anime) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div 
          style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(239, 68, 68, 0.15)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: '#ef4444'
          }}
        >
          <SearchX size={40} />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Anime Not Found</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 2rem auto' }}>
          We couldn't locate the requested anime series. It might have been moved or removed from the catalog.
        </p>
        <Link to="/anime" className="btn btn-primary">
          <ArrowLeft size={18} />
          <span>Browse All Anime</span>
        </Link>
      </div>
    );
  }

  const currentSeasonData = anime.seasons?.find(s => s.season === Number(selectedSeason)) || anime.seasons?.[0];
  const firstSeasonNum = anime.seasons?.[0]?.season || 1;
  const firstEpNum = anime.seasons?.[0]?.episodes?.[0]?.episode || 1;

  return (
    <div>
      {/* Cinematic Hero Details Section */}
      <div className="details-hero">
        <div className="details-backdrop">
          <img src={anime.banner || anime.thumbnail} alt={anime.name} />
          <div className="details-backdrop-overlay" />
        </div>

        <div className="container">
          <div className="details-layout">
            {/* Poster Box */}
            <div className="details-poster-box">
              <img src={anime.thumbnail} alt={`${anime.name} Poster`} />
            </div>

            {/* Main Info */}
            <div className="details-main-info">
              {/* Top Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                {anime.rating && (
                  <span className="badge badge-gold">
                    <Star size={12} fill="#fcd34d" />
                    {anime.rating} Rating
                  </span>
                )}
                <span className={`badge ${anime.status === 'Completed' ? 'badge-emerald' : 'badge-cyan'}`}>
                  <Tv size={12} />
                  {anime.status}
                </span>
                <span className="badge badge-purple">
                  <Calendar size={12} />
                  {anime.releaseYear}
                </span>
                {anime.quality && (
                  <span className="badge badge-glass">
                    {anime.quality}
                  </span>
                )}
                {anime.studio && (
                  <span className="badge badge-glass">
                    <Building size={12} />
                    {anime.studio}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="details-title">{anime.name}</h1>

              {/* Genre Tags */}
              <div className="details-tags">
                {anime.genres?.map(genre => (
                  <Link 
                    key={genre} 
                    to={`/anime?genre=${encodeURIComponent(genre)}`}
                    className="genre-pill"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Synopsis */}
              <p className="details-synopsis">{anime.description}</p>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} className="details-actions">
                <button 
                  type="button"
                  className="btn btn-primary btn-glow"
                  onClick={() => navigate(`/watch/${anime.id}/${firstSeasonNum}/${firstEpNum}`)}
                >
                  <Play size={18} fill="#ffffff" />
                  <span>Watch Episode 1</span>
                </button>
                <Link to="/anime" className="btn btn-secondary">
                  <ArrowLeft size={16} />
                  <span>Back to Catalog</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes & Seasons Section */}
      <div className="container" style={{ padding: '3.5rem 1.5rem 6rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Episodes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Select a season to browse all available streaming episodes.
            </p>
          </div>

          {/* Season Selector Dropdown */}
          <SeasonSelector 
            seasons={anime.seasons || []}
            selectedSeasonNum={selectedSeason}
            onSelectSeason={(sNum) => setSelectedSeason(sNum)}
          />
        </div>

        {/* Episode Grid for Selected Season */}
        <EpisodeList 
          animeId={anime.id}
          seasonNumber={selectedSeason}
          episodes={currentSeasonData?.episodes || []}
          fallbackPoster={anime.thumbnail}
        />
      </div>
    </div>
  );
};
