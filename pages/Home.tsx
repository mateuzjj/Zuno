import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Album, Playlist, Track } from '../types';
import { Card } from '../components/UI/Card';
import { usePlayer } from '../store/PlayerContext';

export const Home: React.FC = () => {
  const [data, setData] = useState<{ albums: Album[], playlists: Playlist[], recent: Track[] } | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    api.getFeatured().then(setData);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (!data) return (
      <div className="flex h-64 items-center justify-center">
          <div className="text-zuno-accent animate-pulse font-bold tracking-widest text-sm">CARREGANDO ZUNO...</div>
      </div>
  );

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Hero / Recent */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white tracking-tight">{getGreeting()}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recent.map((track) => (
            <div 
              key={track.id}
              onClick={() => playTrack(track)}
              className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded-md overflow-hidden cursor-pointer group pr-4"
            >
              <div className="relative w-20 h-20 flex-shrink-0">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0 py-2">
                <h3 className="font-bold text-white truncate text-sm md:text-base">{track.title}</h3>
                <p className="text-xs text-zuno-muted truncate">{track.artist}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 bg-zuno-accent rounded-full p-2.5 shadow-lg transition-all transform scale-90 group-hover:scale-100">
                 <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-zuno-black border-b-[6px] border-b-transparent ml-1"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section>
        <div className="flex items-end justify-between mb-6 border-b border-white/5 pb-2">
          <h2 className="text-xl font-bold text-white">Feito para você</h2>
          <button className="text-xs font-bold text-zuno-muted hover:text-white uppercase tracking-widest transition-colors">Ver tudo</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.playlists.map((playlist) => (
            <Card 
              key={playlist.id}
              title={playlist.title}
              subtitle={playlist.description}
              image={playlist.coverUrl}
              onPlay={(e) => { e.stopPropagation(); /* Play Playlist logic */ }}
            />
          ))}
        </div>
      </section>

       {/* Albums */}
       <section>
        <div className="flex items-end justify-between mb-6 border-b border-white/5 pb-2">
          <h2 className="text-xl font-bold text-white">Novos Lançamentos</h2>
          <button className="text-xs font-bold text-zuno-muted hover:text-white uppercase tracking-widest transition-colors">Ver tudo</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.albums.map((album) => (
            <Card 
              key={album.id}
              title={album.title}
              subtitle={`Álbum • ${album.artist}`}
              image={album.coverUrl}
            />
          ))}
        </div>
      </section>
    </div>
  );
};