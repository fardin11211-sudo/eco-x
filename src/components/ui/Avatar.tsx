import React, { useState } from 'react';

interface AvatarProps {
  photoURL?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  photoURL,
  name,
  size = 'md',
  className = ''
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const getInitials = (str?: string | null) => {
    if (!str || !str.trim()) return 'E';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-base'
  }[size];

  if (photoURL && !imageFailed) {
    return (
      <img
        src={photoURL}
        alt={name || 'User Avatar'}
        onError={() => setImageFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-[#3D4943]/50 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-[#1A1C20] border border-[#73E3B4]/40 text-[#73E3B4] font-bold flex items-center justify-center shrink-0 select-none shadow-sm ${className}`}
      title={name || 'User'}
    >
      {getInitials(name)}
    </div>
  );
};
