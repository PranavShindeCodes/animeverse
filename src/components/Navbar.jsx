import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Tv, 
  Search, 
  Flame, 
  Compass, 
  Bookmark, 
  Menu, 
  X, 
  Sparkles,
  PlaySquare,
  Smartphone
} from 'lucide-react';
import { useRemoteSession } from '../context/RemoteSessionContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal, isRemoteConnected } = useRemoteSession();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/anime?search=${encodeURIComponent(navSearchQuery.trim())}`);
      setSearchOpen(false);
      setNavSearchQuery('');
    }
  };

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-inner">
            {/* Logo */}
            <Link to="/" className="nav-logo" aria-label="AnimeVerse Home">
              <div className="nav-logo-icon">
                <Sparkles size={20} color="#ffffff" />
              </div>
              <span className="nav-logo-text">Anime<span>Verse</span></span>
            </Link>

            {/* Desktop Navigation */}
            <nav>
              <ul className="nav-links">
                <li>
                  <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/anime" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Browse Anime
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/anime?genre=Action" className={({ isActive }) => `nav-link ${isActive && location.search.includes('genre') ? 'active' : ''}`}>
                    Genres
                  </NavLink>
                </li>
              </ul>
            </nav>

            {/* Right Actions */}
            <div className="nav-actions">
              {/* Quick Search trigger */}
              <button 
                type="button" 
                className="nav-search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search dialog"
              >
                <Search size={16} />
                <span>Search anime...</span>
                <span className="nav-search-shortcut">/</span>
              </button>

              {/* Remote Control Button */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={openModal}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: isRemoteConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-accent)',
                  background: isRemoteConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.12)'
                }}
                title="Open Phone Remote Control QR Code"
                aria-label="Phone Remote Control"
              >
                <Smartphone size={15} color={isRemoteConnected ? '#10b981' : 'var(--accent-purple)'} />
                <span>{isRemoteConnected ? 'Phone Connected' : '📱 Remote'}</span>
              </button>

              {/* Mobile Menu Button */}
              <button 
                type="button" 
                className="nav-mobile-toggle"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Search Dialog Modal */}
      {searchOpen && (
        <div className="mobile-menu-overlay" onClick={() => setSearchOpen(false)}>
          <div 
            style={{
              position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(90vw, 560px)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-glow)',
              zIndex: 200,
              animation: 'fadeInUp 0.25s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ margin: 0 }}>
                <Search size={18} className="search-icon-left" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search by title, genre, studio..." 
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.2rem' }}>
                Search
              </button>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <Link to="/" className="nav-logo">
                <div className="nav-logo-icon">
                  <Sparkles size={18} color="#ffffff" />
                </div>
                <span className="nav-logo-text">Anime<span>Verse</span></span>
              </Link>
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-left" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search anime..." 
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <ul className="mobile-nav-links">
              <li>
                <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} end>
                  <PlaySquare size={18} />
                  <span>Home</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/anime" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                  <Compass size={18} />
                  <span>Browse Catalog</span>
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openModal();
                  }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <Smartphone size={18} color="var(--accent-purple)" />
                  <span>📱 Phone Remote</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
