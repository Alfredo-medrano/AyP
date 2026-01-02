import { InputHTMLAttributes, forwardRef } from 'react';
import './input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

        return (
            <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
                {label && <label htmlFor={inputId} className="input-label">{label}</label>}
                <input
                    ref={ref}
                    id={inputId}
                    className="input-field"
                    {...props}
                />
                {error && <span className="input-error">{error}</span>}
                {helperText && !error && <span className="input-helper">{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
