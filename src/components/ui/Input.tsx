import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixSymbol?: string;
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  prefixSymbol,
  isMono = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-medium text-[#BCCAC1]">
          {label}
        </label>
      )}
      <div className="relative">
        {prefixSymbol && (
          <span className="absolute left-3 top-2 text-sm font-mono text-[#73E3B4] select-none pointer-events-none">
            {prefixSymbol}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full py-1.5 rounded bg-[#0C0E12] border text-xs text-[#E2E2E8] placeholder-[#87948C] transition-colors focus:outline-none ${
            prefixSymbol ? 'pl-8 pr-3' : 'px-3'
          } ${
            isMono ? 'font-mono' : 'font-sans'
          } ${
            error
              ? 'border-[#FFB4AB] focus:border-[#FFB4AB]'
              : 'border-[#3D4943]/50 focus:border-[#73E3B4]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] text-[#FFB4AB] mt-0.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
