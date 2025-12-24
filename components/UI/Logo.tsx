import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export const Logo: React.FC<LogoProps> = ({ className = "", variant = "full" }) => {
  // Geometric Grid System:
  // Height: 32px
  // Stroke Weight: ~7px
  // Spacing: 8px
  
  return (
    <svg 
      viewBox={variant === 'icon' ? "0 0 26 32" : "0 0 124 32"} 
      className={className} 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ZUNO Logo"
    >
      {/* Z - The Brand Mark: Bold, Sharp, Forward-leaning dynamics */}
      <path d="M0 0H26V7L10 25H26V32H0V25L16 7H0V0Z" />
      
      {variant === 'full' && (
        <g>
          {/* U - Balanced Cup */}
          <path d="M34 0V22C34 27.5228 38.4772 32 44 32C49.5228 32 54 27.5228 54 22V0H47V22C47 23.6569 45.6569 25 44 25C42.3431 25 41 23.6569 41 22V0H34Z" />
          
          {/* N - Modern Stencil-like verticality */}
          <path d="M62 0H69L81 20V0H88V32H81L69 12V32H62V0Z" />
          
          {/* O - Perfect Geometric Circle with cut-out */}
          <path fillRule="evenodd" clipRule="evenodd" d="M110 32C118.837 32 126 24.8366 126 16C126 7.16344 118.837 0 110 0C101.163 0 94 7.16344 94 16C94 24.8366 101.163 32 110 32ZM110 25C114.971 25 119 20.9706 119 16C119 11.0294 114.971 7 110 7C105.029 7 101 11.0294 101 16C101 20.9706 105.029 25 110 25Z" />
        </g>
      )}
    </svg>
  );
};