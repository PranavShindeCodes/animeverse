import { useEffect } from 'react';

/**
 * Dynamic document title updater
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} — AnimeVerse`;
    } else {
      document.title = 'AnimeVerse — Stream Anime in Ultra HD';
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
