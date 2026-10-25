import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Variant styles adhering strictly to Institutional Emerald tokens
  const variantStyles = {
    primary:
      'bg-[#55C79A] hover:bg-[#73E3B4] active:bg-[#45B288] text-[#003826] font-semibold border-none shadow-sm',
    secondary:
      'bg-[#1E2024] hover:bg-[#282A2E] active:bg-[#333539] text-[#E2E2E8] border border-[#3D4943]/50',
    ghost:
      'bg-transparent hover:bg-[#1E2024] text-[#BCCAC1] hover:text-[#E2E2E8]',
    danger:
      'bg-[#FFB4AB]/15 hover:bg-[#FFB4AB]/25 text-[#FFB4AB] border border-[#FFB4AB]/40'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[11px] gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
