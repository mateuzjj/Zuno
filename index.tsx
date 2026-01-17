import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Preserve Spotify callback code from URL before any other scripts can interfere
// This ensures the OAuth callback is processed even if third-party scripts load first
const preserveCallbackCode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (code || error) {
    // Store in sessionStorage as backup in case URL gets modified
    if (code) {
      sessionStorage.setItem('spotify_callback_code', code);
      console.log('[Init] Preserved Spotify callback code');
    }
    if (error) {
      sessionStorage.setItem('spotify_callback_error', error);
      console.log('[Init] Preserved Spotify callback error:', error);
    }
  }
};

// Run immediately to preserve callback before React loads
preserveCallbackCode();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);