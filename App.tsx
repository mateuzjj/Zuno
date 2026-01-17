import React, { useState, useEffect } from 'react';
import { PlayerProvider } from './store/PlayerContext';
import { Sidebar } from './components/Layout/Sidebar';
import { MobileNav } from './components/Layout/MobileNav';
import { PlayerBar } from './components/Player/PlayerBar';
import { FullScreenPlayer } from './components/Player/FullScreenPlayer';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { LikedSongs } from './pages/LikedSongs';
import { PlaylistPage } from './pages/Playlist';
import { Logo } from './components/UI/Logo';
import { View } from './types';

import { ArtistPage } from './pages/Artist';
import { AlbumPage } from './pages/Album';
import { ToastContainer, toast } from './components/UI/Toast';
import { SpotifyAuth } from './services/spotifyAuth';

// Main App component that handles "routing" via state for simplicity in this SPA demo
const ZunoApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [viewId, setViewId] = useState<string | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      // Check if we're on the callback route OR if there's a code in the URL or sessionStorage
      // This handles cases where the server might not rewrite the route correctly
      // or third-party scripts modify the URL
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code') || !!sessionStorage.getItem('spotify_callback_code');
      const hasError = urlParams.has('error') || !!sessionStorage.getItem('spotify_callback_error');
      const isCallbackPath = window.location.pathname === '/spotify/callback' || 
                             window.location.pathname.includes('/spotify/callback');
      
      if (isCallbackPath || hasCode || hasError) {
        console.log('[App] Processing Spotify callback...');
        setIsProcessingCallback(true);

        try {
          // The getAccessToken function will automatically process the code from URL or sessionStorage
          await SpotifyAuth.getAccessToken();
          toast.show('Conectado ao Spotify com sucesso!', 'success');

          // Redirect to library after successful auth
          setCurrentView('library');

          // Clean up URL - remove all query params and reset path
          const cleanUrl = new URL(window.location.href);
          cleanUrl.search = '';
          cleanUrl.pathname = '/';
          window.history.replaceState({}, document.title, cleanUrl.pathname);
          
          // Clean up sessionStorage backups
          sessionStorage.removeItem('spotify_callback_code');
          sessionStorage.removeItem('spotify_callback_error');
        } catch (error: any) {
          console.error('[App] Failed to process Spotify callback:', error);
          const errorMsg = error?.message || 'Erro desconhecido';
          toast.show(`Erro ao conectar com Spotify: ${errorMsg}`, 'error');

          // Redirect to home on error
          setCurrentView('home');
          const cleanUrl = new URL(window.location.href);
          cleanUrl.search = '';
          cleanUrl.pathname = '/';
          window.history.replaceState({}, document.title, cleanUrl.pathname);
          
          // Clean up sessionStorage backups
          sessionStorage.removeItem('spotify_callback_code');
          sessionStorage.removeItem('spotify_callback_error');
        } finally {
          setIsProcessingCallback(false);
        }
      }
    };

    // Small delay to ensure React is fully mounted
    const timeoutId = setTimeout(handleSpotifyCallback, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleNavigate = (view: View, id?: string) => {
    if (id) setViewId(id);
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home onNavigate={handleNavigate} />;
      case 'search': return <Search onNavigate={handleNavigate} />;
      case 'library': return <Library onNavigate={handleNavigate} />;
      case 'likedSongs': return <LikedSongs />;
      case 'playlist': return viewId ? <PlaylistPage playlistId={viewId} onBack={() => setCurrentView('library')} /> : null;
      case 'artist': return viewId ? <ArtistPage artistId={viewId} onNavigate={handleNavigate} /> : <div className="text-white p-8">No Artist Selected</div>;
      case 'album': return viewId ? <AlbumPage albumId={viewId} onBack={() => setCurrentView('home')} /> : null;
      default: return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div 
      className="flex min-h-screen bg-zuno-black text-zuno-text font-sans selection:bg-zuno-accent selection:text-zuno-black"
      style={{ minHeight: '100dvh' }}
    >
      {/* Show loading state during Spotify callback processing */}
      {isProcessingCallback ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-zuno-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Conectando ao Spotify...</p>
          </div>
        </div>
      ) : (
        <>
          <Sidebar currentView={currentView} setView={setCurrentView} />

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 overflow-y-auto h-screen bg-zuno-main scroll-smooth safe-top player-content-padding">


            {renderView()}
          </main>

          <PlayerBar />
          <FullScreenPlayer />
          <MobileNav currentView={currentView} setView={setCurrentView} />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <ZunoApp />
      <ToastContainer />
    </PlayerProvider>
  );
};

export default App;