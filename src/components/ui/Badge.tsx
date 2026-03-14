'use client';

import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  primary: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  secondary: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  primary: 'bg-green-500',
  secondary: 'bg-orange-500',
};

export default function Badge({ children, variant = 'default', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
        text-xs font-semibold tracking-wide
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse-soft`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active:    { variant: 'success', label: 'Active' },
    reserved:  { variant: 'warning', label: 'Reserved' },
    expired:   { variant: 'danger', label: 'Expired' },
    removed:   { variant: 'danger', label: 'Removed' },
    pending:   { variant: 'info', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
  };
  const entry = map[status] || { variant: 'default' as BadgeVariant, label: status };
  return <Badge variant={entry.variant} dot>{entry.label}</Badge>;
}
