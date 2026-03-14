'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  donor: [
    { label: 'Dashboard', href: '/donor/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Listings', href: '/donor/listings', icon: <Package size={20} /> },
    { label: 'New Listing', href: '/donor/listings/new', icon: <PlusCircle size={20} /> },
    { label: 'Orders', href: '/donor/orders', icon: <ShoppingCart size={20} /> },
  ],
  acceptor: [
    { label: 'Dashboard', href: '/acceptor/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Discover', href: '/acceptor/discover', icon: <Search size={20} /> },
    { label: 'My Orders', href: '/acceptor/orders', icon: <ShoppingCart size={20} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
    { label: 'Listings', href: '/admin/listings', icon: <Package size={20} /> },
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { appUser, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = appUser ? roleNavItems[appUser.role] || [] : [];
  const roleLabel = appUser?.role
    ? appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1)
    : '';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-0
          h-screen w-[260px] bg-surface border-r border-border
          flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                Food<span className="text-primary">Link</span>
              </span>
              <p className="text-[10px] text-muted font-medium -mt-0.5">Reduce Waste</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
            {roleLabel} Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 group
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted hover:bg-gray-50 hover:text-foreground'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
              {appUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{appUser?.name || 'User'}</p>
              <p className="text-xs text-muted truncate">{appUser?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-red-50 hover:text-danger transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Leaf size={18} className="text-primary" />
            <span className="font-bold text-foreground">
              Food<span className="text-primary">Link</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
