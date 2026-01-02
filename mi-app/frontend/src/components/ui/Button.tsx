import { ButtonHTMLAttributes, forwardRef } from 'react';
import './button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, children, disabled, className = '', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`btn btn-${variant} btn-${size} ${isLoading ? 'loading' : ''} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <span className="btn-spinner" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
