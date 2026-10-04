import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { GenreFilter } from '../components/GenreFilter';
import { SortSelector } from '../components/SortSelector';
import { AnimeGrid } from '../components/AnimeGrid';
import { getAllAnime, getAllGenres, filterAndSortAnime } from '../utils/animeData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Compass, RotateCcw, Filter } from 'lucide-react';

export const AnimeList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const allAnime = getAllAnime();
  const genres = getAllGenres();

  const urlSearch = searchParams.get('search') || '';
  const urlGenre = searchParams.get('genre') || 'All';
  const urlSort = searchParams.get('sort') || 'popular';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedGenre, setSelectedGenre] = useState(urlGenre);
  const [sortBy, setSortBy] = useState(urlSort);

  // Sync state when URL params change
  useEffect(() => {
    setSearchQuery(urlSearch);
    setSelectedGenre(urlGenre);
    setSortBy(urlSort);
  }, [urlSearch, urlGenre, urlSort]);

  // Update URL params helper
  const updateUrlParams = (newSearch, newGenre, newSort) => {
    const params = {};
    if (newSearch) params.search = newSearch;
    if (newGenre && newGenre !== 'All') params.genre = newGenre;
    if (newSort && newSort !== 'popular') params.sort = newSort;
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    updateUrlParams(query, selectedGenre, sortBy);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrlParams('', selectedGenre, sortBy);
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    updateUrlParams(searchQuery, genre, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    updateUrlParams(searchQuery, selectedGenre, sort);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSortBy('popular');
    setSearchParams({}, { replace: true });
  };

  // Filter and sort items
  const filteredAnime = filterAndSortAnime({
    animeList: allAnime,
    searchQuery,
    genre: selectedGenre,
    sortBy
  });

  const isFiltered = searchQuery !== '' || selectedGenre !== 'All' || sortBy !== 'popular';

  useDocumentTitle(searchQuery ? `Search: "${searchQuery}"` : selectedGenre !== 'All' ? `${selectedGenre} Anime` : 'Anime Catalog');

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Compass size={28} color="var(--accent-purple)" />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Explore Anime Catalog</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Browse our library of anime series, filter by genres, or search for your next favorite show.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="filter-bar">
        {/* Top search & sort row */}
        <div className="filter-top-row">
          <SearchBar 
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Search anime by title, genres, or keywords..."
          />

          <SortSelector 
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />

          {isFiltered && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ fontSize: '0.85rem', padding: '0.75rem 1rem' }}
              title="Reset all search and genre filters"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Genre Pills */}
        <GenreFilter 
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={handleGenreChange}
        />
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: '#ffffff' }}>{filteredAnime.length}</strong> {filteredAnime.length === 1 ? 'anime' : 'anime titles'}
          {searchQuery && <span> matching "<span style={{ color: 'var(--accent-purple)' }}>{searchQuery}</span>"</span>}
          {selectedGenre !== 'All' && <span> in <span style={{ color: 'var(--accent-purple)' }}>{selectedGenre}</span></span>}
        </div>
      </div>

      {/* Grid */}
      <AnimeGrid 
        animeList={filteredAnime}
        emptyMessage={
          searchQuery 
            ? `No anime found matching "${searchQuery}". Try a different title or keyword.`
            : `No anime found in the "${selectedGenre}" genre.`
        }
      />
    </div>
  );
};
