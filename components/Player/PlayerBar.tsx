import React from 'react';
import { usePlayer } from '../../store/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { PlayerStatus } from '../../types';

export const PlayerBar: React.FC = () => {
  const { currentTrack, status, currentTime, togglePlay, nextTrack, prevTrack, seek, volume, setVolume, toggleMute, isMuted } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const isPlaying = status === PlayerStatus.PLAYING;

  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-zuno-black border-t border-zuno-dark p-3 md:p-4 z-50">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-[120px]">
          <img 
            src={currentTrack.coverUrl} 
            alt={currentTrack.title} 
            className="w-12 h-12 md:w-14 md:h-14 rounded bg-zuno-dark object-cover"
          />
          <div className="hidden md:block overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-zuno-muted truncate hover:text-white cursor-pointer transition-colors">
              {currentTrack.artist}
            </p>
          </div>
          {/* Mobile Text */}
          <div className="block md:hidden overflow-hidden">
             <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
          </div>
        </div>

        {/* Controls & Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-2xl">
          <div className="flex items-center gap-6 mb-1">
            <button onClick={prevTrack} className="text-zuno-muted hover:text-white transition-colors">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5"/>}
            </button>
            <button onClick={nextTrack} className="text-zuno-muted hover:text-white transition-colors">
              <SkipForward size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-zuno-muted w-10 text-right font-mono">{formatTime(currentTime)}</span>
            <div className="group relative w-full flex items-center h-4">
               <input
                type="range"
                min={0}
                max={currentTrack.duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zuno-dark rounded-lg appearance-none cursor-pointer accent-white hover:accent-zuno-accent"
                style={{
                  background: `linear-gradient(to right, #ffffff ${
                    (currentTime / currentTrack.duration) * 100
                  }%, #1A1A1F ${
                    (currentTime / currentTrack.duration) * 100
                  }%)`,
                }}
              />
            </div>
            <span className="text-xs text-zuno-muted w-10 font-mono">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Volume & Extras (Desktop only) */}
        <div className="hidden md:flex items-center justify-end w-1/3 gap-4">
          <button className="text-zuno-muted hover:text-white">
            <Maximize2 size={18} />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <button onClick={toggleMute} className="text-zuno-muted hover:text-white">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-zuno-dark rounded-lg appearance-none cursor-pointer accent-white"
               style={{
                  background: `linear-gradient(to right, #ffffff ${
                    volume * 100
                  }%, #1A1A1F ${
                    volume * 100
                  }%)`,
                }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};