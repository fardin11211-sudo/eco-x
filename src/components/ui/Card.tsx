import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  isInteractive = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-[#1A1C20] border border-[#3D4943]/40 rounded-lg p-4 sm:p-5 transition-colors ${
        isInteractive ? 'hover:border-[#73E3B4]/40 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
