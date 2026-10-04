import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { AnimeGrid } from '../components/AnimeGrid';
import { AnimeCard } from '../components/AnimeCard';
import { ContinueWatching } from '../components/ContinueWatching';
import { GenreFilter } from '../components/GenreFilter';
import { getAllAnime, getFeaturedAnimeList, getAllGenres, filterAndSortAnime } from '../utils/animeData';
import { getWatchHistory } from '../utils/storage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Flame, Compass, Sparkles, ArrowRight } from 'lucide-react';

export const Home = () => {
  useDocumentTitle('AnimeVerse — Watch Anime in Ultra HD');

  const [history, setHistory] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const allAnime = getAllAnime();
  const featuredAnime = getFeaturedAnimeList();
  const genres = getAllGenres();

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  const filteredByGenre = filterAndSortAnime({
    animeList: allAnime,
    genre: selectedGenre,
    sortBy: 'popular'
  });

  const trendingAnime = [...allAnime].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);

  return (
    <div>
      {/* Cinematic Hero */}
      <Hero featuredAnimeList={featuredAnime} />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Continue Watching (From localStorage) */}
        <ContinueWatching 
          history={history} 
          onHistoryUpdated={(updated) => setHistory(updated)} 
        />

        {/* Trending Now Section */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <Flame size={22} color="#ec4899" />
              <span>Trending Now</span>
            </h2>
            <Link 
              to="/anime?sort=popular" 
              style={{ 
                color: 'var(--accent-purple)', 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem' 
              }}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="anime-grid">
            {trendingAnime.map(anime => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </section>

        {/* Genre Exploration & All Catalog */}
        <section>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title">
              <Compass size={22} color="#06b6d4" />
              <span>Explore Anime</span>
            </h2>
            <Link 
              to="/anime" 
              style={{ 
                color: 'var(--accent-purple)', 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem' 
              }}
            >
              <span>Full Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Genre Pills */}
          <div style={{ marginBottom: '1.5rem' }}>
            <GenreFilter 
              genres={genres} 
              selectedGenre={selectedGenre} 
              onSelectGenre={(g) => setSelectedGenre(g)} 
            />
          </div>

          {/* Grid */}
          <AnimeGrid 
            animeList={filteredByGenre} 
            emptyMessage={`No anime found in the "${selectedGenre}" genre.`} 
          />
        </section>
      </div>
    </div>
  );
};
