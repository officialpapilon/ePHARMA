import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          {
            'bg-[#1976d2] text-white hover:bg-[#1565c0] active:bg-[#115293]':
              variant === 'primary',

            'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700':
              variant === 'secondary',

            'bg-red-600 text-white hover:bg-red-700':
              variant === 'danger',

            'bg-green-600 text-white hover:bg-green-700':
              variant === 'success',

            'bg-gradient-to-r from-[#1976d2] to-[#43cea2] text-white hover:from-[#1565c0] hover:to-[#11998e]':
              variant === 'gradient',

            'text-base px-5 py-2 h-11': size === 'md',
            'text-lg px-7 py-3 h-14': size === 'lg',
            'text-sm px-4 py-1.5 h-8': size === 'sm',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;