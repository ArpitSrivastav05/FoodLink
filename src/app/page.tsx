'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/ui/Button';
import {
  Leaf,
  ArrowRight,
  Utensils,
  Handshake,
  Shield,
  TrendingDown,
  Heart,
  Globe,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export default function HomePage() {
  const { appUser, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // If logged in, redirect to their dashboard automatically
  useEffect(() => {
    if (!loading && appUser) {
      router.replace(`/${appUser.role}/dashboard`);
    }
  }, [loading, appUser, router]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-orange-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Food<span className="text-primary">Link</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun size={18} className="text-amber-400" />
                : <Moon size={18} className="text-slate-600" />}
            </button>
            {loading ? null : appUser ? (
              <>
                <Link href={`/${appUser.role}/dashboard`}>
                  <Button size="sm">Go to Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} icon={<LogOut size={14} />}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-emerald-200">
            <Heart size={14} />
            Reducing food waste, one meal at a time
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Connect Surplus Food<br />
            with Those Who <span className="text-primary">Need It</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            FoodLink is a marketplace where restaurants, caterers, and event halls can list surplus food
            for NGOs, hostels, and vendors — reducing waste and feeding communities.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" icon={<ArrowRight size={18} />}>
                Start Donating
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Find Food
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { value: '10K+', label: 'Meals Saved', icon: <Utensils size={22} className="text-primary" /> },
            { value: '500+', label: 'Donors Active', icon: <Heart size={22} className="text-red-500" /> },
            { value: '2K+', label: 'Orders Completed', icon: <Handshake size={22} className="text-blue-500" /> },
            { value: '5 Tons', label: 'CO₂ Reduced', icon: <Globe size={22} className="text-emerald-500" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-center mb-12">
          How It <span className="text-primary">Works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 stagger-children">
          {[
            {
              icon: <Utensils size={28} className="text-primary" />,
              title: 'Donors List Food',
              desc: 'Restaurants and caterers post surplus food with quantity, expiry, and hygiene details. Our AI helps write great descriptions.',
            },
            {
              icon: <Handshake size={28} className="text-secondary" />,
              title: 'Acceptors Discover & Order',
              desc: 'NGOs and vendors browse available food, filter by type and distance, and place orders at reduced prices.',
            },
            {
              icon: <Shield size={28} className="text-accent" />,
              title: 'Admin Ensures Quality',
              desc: 'Admins monitor listings, manage users, and track analytics — ensuring a trustworthy marketplace.',
            },
          ].map((step) => (
            <div key={step.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-primary to-emerald-400 rounded-3xl p-10 text-white">
          <TrendingDown size={36} className="mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-extrabold mb-3">Ready to Reduce Food Waste?</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Join hundreds of donors and acceptors making a real impact.
            Every listing saved is a meal delivered.
          </p>
          <Link href="/register">
            <Button variant="outline" size="lg" className="!text-white !border-white hover:!bg-white/20">
              Join FoodLink Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-muted">
        <p>© 2026 FoodLink. Built to reduce waste and feed communities.</p>
      </footer>
    </div>
  );
}
