import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export const Logo: React.FC<LogoProps> = ({ className = "", variant = "full" }) => {
  return (
    <img
      src="/logo.png"
      alt="ZUNO Logo"
      className={`object-contain ${className}`}
      style={{
        height: variant === 'icon' ? '32px' : 'auto',
        maxWidth: variant === 'icon' ? '32px' : '120px'
      }}
    />
  );
};