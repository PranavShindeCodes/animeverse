import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Shield, Film, Tv, Radio } from 'lucide-react';
import { getAllGenres } from '../utils/animeData';

export const Footer = () => {
  const genres = getAllGenres().filter(g => g !== 'All').slice(0, 6);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-col">
            <Link to="/" className="nav-logo" style={{ marginBottom: '1rem' }}>
              <div className="nav-logo-icon">
                <Sparkles size={18} color="#ffffff" />
              </div>
              <span className="nav-logo-text">Anime<span>Verse</span></span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '320px', marginBottom: '1.2rem' }}>
              The ultimate modern dark-themed anime streaming experience. Stream high definition episodes with ultra-low latency and zero interruptions.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-purple">4K Ultra HD</span>
              <span className="badge badge-pink">Fast Buffer</span>
              <span className="badge badge-cyan">Zero Ads</span>
            </div>
          </div>

          {/* Navigation Col */}
          <div className="footer-col">
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/anime">All Anime Catalog</Link></li>
              <li><Link to="/anime?sort=popular">Top Rated Anime</Link></li>
              <li><Link to="/anime?sort=newest">New Releases</Link></li>
            </ul>
          </div>

          {/* Genres Col */}
          <div className="footer-col">
            <h4>Popular Genres</h4>
            <ul className="footer-links">
              {genres.map(genre => (
                <li key={genre}>
                  <Link to={`/anime?genre=${encodeURIComponent(genre)}`}>{genre}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quality & Info Col */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><span style={{ color: 'var(--text-dim)' }}>HTML5 Video Engine</span></li>
              <li><span style={{ color: 'var(--text-dim)' }}>Dynamic JSON Driven</span></li>
              <li><span style={{ color: 'var(--text-dim)' }}>Local Watch History</span></li>
              <li><span style={{ color: 'var(--text-dim)' }}>Full Responsive UI</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} AnimeVerse. Frontend-only demonstration platform.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
            <span>for Anime Enthusiasts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
