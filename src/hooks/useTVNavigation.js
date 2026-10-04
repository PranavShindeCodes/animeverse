import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRemoteSession } from '../context/RemoteSessionContext';

const FOCUSABLE_SELECTOR = 'a:not([disabled]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled]), .anime-card, .continue-card, .episode-card, .genre-pill, .btn';

export const useTVNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerCommandListener, isModalOpen, closeModal } = useRemoteSession();
  const currentFocusedElRef = useRef(null);

  // Clear TV focus highlight
  const clearTvFocus = useCallback(() => {
    document.querySelectorAll('.tv-focused-element').forEach(el => {
      el.classList.remove('tv-focused-element');
    });
  }, []);

  // Apply TV focus highlight to an element
  const setTvFocus = useCallback((element) => {
    if (!element) return;
    clearTvFocus();
    currentFocusedElRef.current = element;
    element.classList.add('tv-focused-element');
    element.focus?.({ preventScroll: true });
    
    // Smooth scroll into viewport
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }, [clearTvFocus]);

  // Find all visible focusable elements in document
  const getFocusableElements = useCallback(() => {
    const all = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR));
    return all.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    });
  }, []);

  // Move spatial navigation in a direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  const moveDirection = useCallback((direction) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let current = currentFocusedElRef.current;
    // If current element is detached or not in visible list, find activeElement or default to first
    if (!current || !document.body.contains(current)) {
      current = elements.find(el => el === document.activeElement) || elements[0];
      setTvFocus(current);
      return;
    }

    const curRect = current.getBoundingClientRect();
    const curCenterX = curRect.left + curRect.width / 2;
    const curCenterY = curRect.top + curRect.height / 2;

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const el of elements) {
      if (el === current) continue;

      const rect = el.getBoundingClientRect();
      const elCenterX = rect.left + rect.width / 2;
      const elCenterY = rect.top + rect.height / 2;

      const dx = elCenterX - curCenterX;
      const dy = elCenterY - curCenterY;

      let isValidDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (direction) {
        case 'UP':
          if (dy < -8) { // Is above
            isValidDirection = true;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
          }
          break;
        case 'DOWN':
          if (dy > 8) { // Is below
            isValidDirection = true;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
          }
          break;
        case 'LEFT':
          if (dx < -8) { // Is to left
            isValidDirection = true;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
          }
          break;
        case 'RIGHT':
          if (dx > 8) { // Is to right
            isValidDirection = true;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
          }
          break;
        default:
          break;
      }

      if (isValidDirection) {
        // Weighted distance calculation: heavily penalize deviation from orthogonal axis
        const score = primaryDist + secondaryDist * 2.2;
        if (score < minDistance) {
          minDistance = score;
          bestCandidate = el;
        }
      }
    }

    // Fallback if no direct spatial candidate found: circular wrap or step in DOM
    if (!bestCandidate) {
      const currentIndex = elements.indexOf(current);
      if (direction === 'RIGHT' || direction === 'DOWN') {
        bestCandidate = elements[(currentIndex + 1) % elements.length];
      } else if (direction === 'LEFT' || direction === 'UP') {
        bestCandidate = elements[(currentIndex - 1 + elements.length) % elements.length];
      }
    }

    if (bestCandidate) {
      setTvFocus(bestCandidate);
    }
  }, [getFocusableElements, setTvFocus]);

  // Handle NAV_OK
  const handleOk = useCallback(() => {
    const current = currentFocusedElRef.current || document.activeElement;
    if (current) {
      current.click();
    }
  }, []);

  // Handle NAV_BACK
  const handleBack = useCallback(() => {
    if (isModalOpen) {
      closeModal();
      return;
    }

    // If in fullscreen, exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      return;
    }

    if (location.pathname !== '/') {
      navigate(-1);
    }
  }, [isModalOpen, closeModal, location.pathname, navigate]);

  // Handle NAV_HOME
  const handleHome = useCallback(() => {
    if (isModalOpen) closeModal();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearTvFocus();
  }, [isModalOpen, closeModal, navigate, clearTvFocus]);

  // Clear focus when route changes
  useEffect(() => {
    clearTvFocus();
    currentFocusedElRef.current = null;
  }, [location.pathname, clearTvFocus]);

  // Remove TV focus on mouse click
  useEffect(() => {
    const handleMouseDown = () => {
      clearTvFocus();
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [clearTvFocus]);

  // Listen to remote commands
  useEffect(() => {
    const unregister = registerCommandListener((cmd) => {
      if (!cmd || !cmd.action) return;

      switch (cmd.action) {
        case 'NAV_UP':
          moveDirection('UP');
          break;
        case 'NAV_DOWN':
          moveDirection('DOWN');
          break;
        case 'NAV_LEFT':
          moveDirection('LEFT');
          break;
        case 'NAV_RIGHT':
          moveDirection('RIGHT');
          break;
        case 'NAV_OK':
          handleOk();
          break;
        case 'NAV_BACK':
          handleBack();
          break;
        case 'NAV_HOME':
          handleHome();
          break;
        default:
          break;
      }
    });

    return unregister;
  }, [registerCommandListener, moveDirection, handleOk, handleBack, handleHome]);
};
