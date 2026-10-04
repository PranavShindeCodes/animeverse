import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers } from 'lucide-react';

export const SeasonSelector = ({ seasons = [], selectedSeasonNum, onSelectSeason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!seasons || seasons.length === 0) return null;

  const currentSeason = seasons.find(s => s.season === Number(selectedSeasonNum)) || seasons[0];

  return (
    <div className="season-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="season-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Layers size={18} color="var(--accent-purple)" />
        <span>{currentSeason.name || `Season ${currentSeason.season}`}</span>
        <ChevronDown 
          size={18} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.25s ease' 
          }} 
        />
      </button>

      {isOpen && (
        <div className="season-dropdown-menu" role="listbox">
          {seasons.map((season) => {
            const isSelected = season.season === currentSeason.season;
            const episodeCount = season.episodes?.length || 0;
            return (
              <button
                key={season.season}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`season-menu-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectSeason(season.season);
                  setIsOpen(false);
                }}
              >
                <span>{season.name || `Season ${season.season}`}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {episodeCount} {episodeCount === 1 ? 'ep' : 'eps'}
                  </span>
                  {isSelected && <Check size={14} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
