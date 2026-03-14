'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm
              text-foreground placeholder:text-muted/60
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm
            text-foreground placeholder:text-muted/60 min-h-[100px] resize-y
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm
            text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all duration-200 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
