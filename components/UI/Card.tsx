import React from 'react';
import { Play } from 'lucide-react';

interface CardProps {
  image: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  onPlay?: (e: React.MouseEvent) => void;
  rounded?: boolean;
}

export const Card: React.FC<CardProps> = ({ image, title, subtitle, onClick, onPlay, rounded = false }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative p-4 rounded-md bg-zuno-dark/40 hover:bg-zuno-dark transition-all duration-300 cursor-pointer w-full"
    >
      <div className="relative aspect-square mb-4 overflow-hidden shadow-lg">
        <img 
          src={image} 
          alt={title} 
          className={`w-full h-full object-cover ${rounded ? 'rounded-full' : 'rounded-md'}`}
          loading="lazy"
        />
        {/* Play Button Overlay */}
        <button 
          onClick={onPlay}
          className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-zuno-accent text-zuno-black p-3 rounded-full shadow-xl hover:scale-105"
        >
          <Play fill="currentColor" size={20} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-white truncate">{title}</h3>
        <p className="text-sm text-zuno-muted truncate">{subtitle}</p>
      </div>
    </div>
  );
};