import React from 'react';

export const Library: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
       <div className="w-20 h-20 bg-zuno-dark rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🎵</span>
       </div>
       <h2 className="text-2xl font-bold text-white">Sua biblioteca está vazia</h2>
       <p className="text-zuno-muted max-w-md">
         Parece que você ainda não salvou nada. Explore o ZUNO para encontrar sons que vibram com você.
       </p>
       <button className="mt-6 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
         Explorar Agora
       </button>
    </div>
  );
};