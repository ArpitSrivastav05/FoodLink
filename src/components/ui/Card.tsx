'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-border bg-surface p-5
        transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 cursor-pointer' : 'shadow-sm'}
        ${glass ? 'glass' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-bold text-foreground ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-muted mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 flex items-center gap-3 pt-4 border-t border-border ${className}`}>{children}</div>;
}
