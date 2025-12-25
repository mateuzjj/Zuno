import React, { useState } from 'react';
import { Heart, Music, Plus, Play, Disc } from 'lucide-react';
import { usePlayer } from '../store/PlayerContext';
// import { ZunoAPI } from '../services/zunoApi'; // We might use this later for real data

export const Library: React.FC = () => {
  // Mock data for initial view
  const playlists = [
    { id: '1', name: 'My Top 50', count: 50, cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&q=80' },
    { id: '2', name: 'Chill Vibes', count: 124, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80' },
    { id: '3', name: 'Gym Motivation', count: 45, cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
  ];

  const likedTracks = [
    { id: 'l1', title: 'Starboy', artist: 'The Weeknd', date: '2 days ago' },
    { id: 'l2', title: 'Midnight City', artist: 'M83', date: '1 week ago' },
    { id: 'l3', title: 'Heat Waves', artist: 'Glass Animals', date: '2 weeks ago' },
  ];

  return (
    <div className="p-8 pb-32 min-h-screen bg-gradient-to-b from-zuno-main to-black">
      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-52 h-52 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-purple-900/40 rounded-lg flex items-center justify-center">
          <Heart size={80} className="text-white fill-white/20" />
        </div>
        <div className="mb-2">
          <p className="text-sm font-bold uppercase tracking-widest text-white mb-1">Playlist</p>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">Músicas Curtidas</h1>
          <div className="flex items-center gap-2 text-sm text-zuno-muted font-medium">
            <span className="text-white">Mateus</span>
            <span>•</span>
            <span>328 músicas</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-8">
        <button className="w-14 h-14 rounded-full bg-zuno-accent flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-green-900/40 text-black">
          <Play size={24} fill="currentColor" className="ml-1" />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Seus Playlists</h2>
            <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors">
              <Plus size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-zuno-card p-4 rounded-card hover:bg-white/5 transition-colors group cursor-pointer">
                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
                  <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="font-bold text-white truncate">{pl.name}</h3>
                <p className="text-sm text-zuno-muted">By You</p>
              </div>
            ))}
          </div>
        </section>

        {/* Liked / Recent Section (Simple List) */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Adicionadas Recentemente</h2>
          <div className="flex flex-col">
            {likedTracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer">
                <span className="text-zuno-muted w-4 text-center group-hover:text-white">{i + 1}</span>
                <div className="flex-1">
                  <h4 className="text-white font-medium group-hover:text-zuno-accent transition-colors">{track.title}</h4>
                  <p className="text-sm text-zuno-muted">{track.artist}</p>
                </div>
                <span className="text-sm text-zuno-muted">{track.date}</span>
                <div className="opacity-0 group-hover:opacity-100 text-zuno-accent">
                  <Heart size={16} fill="currentColor" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
