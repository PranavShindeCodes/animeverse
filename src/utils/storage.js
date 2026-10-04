const STORAGE_KEYS = {
  WATCH_HISTORY: 'anime_watch_history',
  LAST_WATCHED: 'anime_last_watched',
  WATCHLIST: 'anime_watchlist',
  VOLUME: 'anime_player_volume',
  MUTED: 'anime_player_muted'
};

/**
 * Get all watch history items (max 10 items, newest first)
 */
export const getWatchHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read watch history from localStorage', e);
    return [];
  }
};

/**
 * Save or update watch progress for an anime episode
 */
export const saveWatchProgress = ({
  animeId,
  animeName,
  animeThumbnail,
  season,
  episode,
  episodeTitle,
  currentTime = 0,
  duration = 0
}) => {
  try {
    const history = getWatchHistory();
    const progressPercent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
    
    const newItem = {
      animeId,
      animeName,
      animeThumbnail,
      season: Number(season),
      episode: Number(episode),
      episodeTitle,
      currentTime: Math.round(currentTime),
      duration: Math.round(duration),
      progressPercent,
      timestamp: Date.now()
    };

    // Remove existing entry for this anime to avoid duplicates
    const filtered = history.filter(item => item.animeId !== animeId);
    
    // Add to front and limit to 10
    const updatedHistory = [newItem, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updatedHistory));
    
    // Also save as last watched
    localStorage.setItem(STORAGE_KEYS.LAST_WATCHED, JSON.stringify(newItem));
    
    return newItem;
  } catch (e) {
    console.error('Failed to save watch progress', e);
    return null;
  }
};

/**
 * Get the most recently watched anime episode
 */
export const getContinueWatching = () => {
  try {
    const history = getWatchHistory();
    return history.length > 0 ? history[0] : null;
  } catch (e) {
    return null;
  }
};

/**
 * Remove specific anime from history
 */
export const removeWatchHistory = (animeId) => {
  try {
    const history = getWatchHistory().filter(item => item.animeId !== animeId);
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));
    return history;
  } catch (e) {
    return [];
  }
};

/**
 * Clear all watch history
 */
export const clearWatchHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.LAST_WATCHED);
  } catch (e) {
    console.error('Failed to clear watch history', e);
  }
};

/**
 * Watchlist helpers
 */
export const getWatchlist = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const toggleWatchlist = (animeId) => {
  try {
    const current = getWatchlist();
    let updated;
    if (current.includes(animeId)) {
      updated = current.filter(id => id !== animeId);
    } else {
      updated = [animeId, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const isInWatchlist = (animeId) => {
  const current = getWatchlist();
  return current.includes(animeId);
};

export const getStoredVolume = () => {
  try {
    const vol = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return vol !== null ? parseFloat(vol) : 0.8;
  } catch {
    return 0.8;
  }
};

export const setStoredVolume = (vol) => {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(vol));
  } catch {}
};
