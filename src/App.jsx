import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { RemoteSessionProvider } from './context/RemoteSessionContext';
import { RemoteModal } from './components/RemoteModal';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AnimeList } from './pages/AnimeList';
import { AnimeDetails } from './pages/AnimeDetails';
import { Watch } from './pages/Watch';
import { NotFound } from './pages/NotFound';
import { RemoteController } from './pages/RemoteController';
import { useTVNavigation } from './hooks/useTVNavigation';

// Scroll restoration component on route transition
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Sub-component to activate TV spatial navigation
const TVNavigationListener = () => {
  const location = useLocation();
  const isRemoteRoute = location.pathname.startsWith('/remote/');
  
  if (!isRemoteRoute) {
    // Only active on laptop views
    useTVNavigation();
  }
  return null;
};

export const App = () => {
  const location = useLocation();
  const isRemoteRoute = location.pathname.startsWith('/remote/');

  return (
    <RemoteSessionProvider>
      <ScrollToTop />
      <TVNavigationListener />
      {/* Do not render standard desktop Navbar/Footer on dedicated phone remote route */}
      {!isRemoteRoute && <Navbar />}
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime" element={<AnimeList />} />
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
          <Route path="/watch/:animeId/:season/:episode" element={<Watch />} />
          <Route path="/remote/:sessionId" element={<RemoteController />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isRemoteRoute && <Footer />}
      <RemoteModal />
    </RemoteSessionProvider>
  );
};

export default App;
