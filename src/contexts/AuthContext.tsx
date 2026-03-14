'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = useCallback(async (firebaseUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setAppUser({ uid: firebaseUser.uid, ...userDoc.data() } as AppUser);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchAppUser(firebaseUser);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAppUser]);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchAppUser(cred.user);
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: Omit<AppUser, 'uid'> = {
      name,
      email,
      role,
      rating: 5,
      totalOrders: 0,
      blocked: false,
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
    } catch (firestoreError) {
      console.error('Firestore write failed (check if Firestore DB is created & rules allow writes):', firestoreError);
      // Don't throw — user is already created in Auth, let them proceed
    }
    setAppUser({ uid: cred.user.uid, ...newUser });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
