import React from 'react';

export const GenreFilter = ({ genres = [], selectedGenre = 'All', onSelectGenre }) => {
  return (
    <div className="genre-pills-container" role="tablist" aria-label="Genre Filters">
      {genres.map((genre) => {
        const isActive = selectedGenre.toLowerCase() === genre.toLowerCase();
        return (
          <button
            key={genre}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`genre-pill ${isActive ? 'active' : ''}`}
            onClick={() => onSelectGenre(genre)}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
