import React from 'react';
import { Home, Search, Library, Wand2 } from 'lucide-react';
import { View } from '../../types';

interface MobileNavProps {
  currentView: View;
  setView: (view: View) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, setView }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-zuno-black to-zuno-black/95 border-t border-white/5 flex items-center justify-around z-50 backdrop-blur-md">
      <button 
        onClick={() => setView('home')}
        className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-white' : 'text-zuno-muted'}`}
      >
        <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
        <span className="text-[10px]">Início</span>
      </button>
      
      <button 
        onClick={() => setView('search')}
        className={`flex flex-col items-center gap-1 ${currentView === 'search' ? 'text-white' : 'text-zuno-muted'}`}
      >
        <Search size={22} strokeWidth={currentView === 'search' ? 2.5 : 2} />
        <span className="text-[10px]">Buscar</span>
      </button>

      <button 
        onClick={() => setView('editor')}
        className={`flex flex-col items-center gap-1 ${currentView === 'editor' ? 'text-zuno-accent' : 'text-zuno-muted'}`}
      >
        <Wand2 size={22} strokeWidth={currentView === 'editor' ? 2.5 : 2} />
        <span className="text-[10px]">Magic</span>
      </button>
      
      <button 
        onClick={() => setView('library')}
        className={`flex flex-col items-center gap-1 ${currentView === 'library' ? 'text-white' : 'text-zuno-muted'}`}
      >
        <Library size={22} strokeWidth={currentView === 'library' ? 2.5 : 2} />
        <span className="text-[10px]">Biblioteca</span>
      </button>
    </nav>
  );
};