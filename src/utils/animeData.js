import animeCatalog from '../data/anime.json';

/**
 * Get all anime from the single JSON source of truth
 */
export const getAllAnime = () => {
  return Array.isArray(animeCatalog?.anime) ? animeCatalog.anime : [];
};

/**
 * Get single anime by ID (slug)
 */
export const getAnimeById = (id) => {
  if (!id) return null;
  const animeList = getAllAnime();
  return animeList.find(item => item.id.toLowerCase() === String(id).toLowerCase()) || null;
};

/**
 * Dynamically extract all unique genres from anime dataset
 */
export const getAllGenres = () => {
  const animeList = getAllAnime();
  const genreSet = new Set();
  
  animeList.forEach(anime => {
    if (Array.isArray(anime.genres)) {
      anime.genres.forEach(g => genreSet.add(g.trim()));
    }
  });

  const sortedGenres = Array.from(genreSet).sort();
  return ['All', ...sortedGenres];
};

/**
 * Get featured anime for hero section (first or highest rated)
 */
export const getFeaturedAnimeList = () => {
  const animeList = getAllAnime();
  if (animeList.length === 0) return [];
  // Return top 4 for hero carousel / featured rotation
  return [...animeList].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
};

/**
 * Get specific season by number for an anime
 */
export const getSeason = (animeId, seasonNumber) => {
  const anime = getAnimeById(animeId);
  if (!anime || !Array.isArray(anime.seasons)) return null;
  
  const targetNum = Number(seasonNumber);
  return anime.seasons.find(s => s.season === targetNum) || null;
};

/**
 * Get specific episode by season and episode number
 */
export const getEpisode = (animeId, seasonNumber, episodeNumber) => {
  const season = getSeason(animeId, seasonNumber);
  if (!season || !Array.isArray(season.episodes)) return null;
  
  const epNum = Number(episodeNumber);
  return season.episodes.find(ep => ep.episode === epNum) || null;
};

/**
 * Calculate the next episode across seasons
 */
export const getNextEpisode = (animeId, currentSeasonNum, currentEpNum) => {
  const anime = getAnimeById(animeId);
  if (!anime || !Array.isArray(anime.seasons)) return null;

  const sNum = Number(currentSeasonNum);
  const eNum = Number(currentEpNum);

  const currentSeason = anime.seasons.find(s => s.season === sNum);
  if (!currentSeason || !Array.isArray(currentSeason.episodes)) return null;

  // Check if next episode exists in same season
  const nextEpInSameSeason = currentSeason.episodes.find(ep => ep.episode === eNum + 1);
  if (nextEpInSameSeason) {
    return {
      season: sNum,
      episode: nextEpInSameSeason.episode,
      data: nextEpInSameSeason
    };
  }

  // Look for first episode of next available season
  const nextSeason = anime.seasons.find(s => s.season === sNum + 1);
  if (nextSeason && Array.isArray(nextSeason.episodes) && nextSeason.episodes.length > 0) {
    return {
      season: nextSeason.season,
      episode: nextSeason.episodes[0].episode,
      data: nextSeason.episodes[0]
    };
  }

  return null;
};

/**
 * Calculate the previous episode across seasons
 */
export const getPrevEpisode = (animeId, currentSeasonNum, currentEpNum) => {
  const anime = getAnimeById(animeId);
  if (!anime || !Array.isArray(anime.seasons)) return null;

  const sNum = Number(currentSeasonNum);
  const eNum = Number(currentEpNum);

  const currentSeason = anime.seasons.find(s => s.season === sNum);
  if (!currentSeason || !Array.isArray(currentSeason.episodes)) return null;

  // Check if prev episode exists in same season
  const prevEpInSameSeason = currentSeason.episodes.find(ep => ep.episode === eNum - 1);
  if (prevEpInSameSeason) {
    return {
      season: sNum,
      episode: prevEpInSameSeason.episode,
      data: prevEpInSameSeason
    };
  }

  // Look for last episode of previous season
  const prevSeason = anime.seasons.find(s => s.season === sNum - 1);
  if (prevSeason && Array.isArray(prevSeason.episodes) && prevSeason.episodes.length > 0) {
    const lastEp = prevSeason.episodes[prevSeason.episodes.length - 1];
    return {
      season: prevSeason.season,
      episode: lastEp.episode,
      data: lastEp
    };
  }

  return null;
};

/**
 * Filter and sort anime dataset based on query, genre, and sort option
 */
export const filterAndSortAnime = ({
  animeList = getAllAnime(),
  searchQuery = '',
  genre = 'All',
  sortBy = 'popular'
}) => {
  let results = [...animeList];

  // 1. Filter by search query (name, description, or genre match)
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    results = results.filter(anime => {
      const matchName = anime.name?.toLowerCase().includes(q);
      const matchDesc = anime.description?.toLowerCase().includes(q);
      const matchGenre = anime.genres?.some(g => g.toLowerCase().includes(q));
      const matchStudio = anime.studio?.toLowerCase().includes(q);
      return matchName || matchDesc || matchGenre || matchStudio;
    });
  }

  // 2. Filter by genre
  if (genre && genre !== 'All') {
    results = results.filter(anime => 
      Array.isArray(anime.genres) && anime.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
  }

  // 3. Sort
  results.sort((a, b) => {
    switch (sortBy) {
      case 'az':
        return (a.name || '').localeCompare(b.name || '');
      case 'za':
        return (b.name || '').localeCompare(a.name || '');
      case 'newest':
        return (b.releaseYear || 0) - (a.releaseYear || 0);
      case 'oldest':
        return (a.releaseYear || 0) - (b.releaseYear || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'popular':
      default:
        return (b.rating || 0) - (a.rating || 0);
    }
  });

  return results;
};
