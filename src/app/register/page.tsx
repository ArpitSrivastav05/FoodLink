'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Leaf, Mail, Lock, User, Phone } from 'lucide-react';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, role);
      router.push(`/${role}/dashboard`);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Join Food<span className="text-primary">Link</span>
          </h1>
          <p className="text-sm text-muted mt-1">Create your account and start making a difference</p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200 animate-fade-in">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} />}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={16} />}
            />

            <Select
              label="I am a"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'donor', label: '🍲 Food Donor (Restaurant / Caterer / Hall)' },
                { value: 'acceptor', label: '🤝 Food Acceptor (NGO / Hostel / Vendor)' },
              ]}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
