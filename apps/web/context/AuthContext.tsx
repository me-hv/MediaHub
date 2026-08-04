'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUserClient, getStoredUser, setStoredUser } from '../lib/firebase';

interface AuthContextType {
  user: AuthUserClient | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = getStoredUser();
    if (saved) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    const mockUser: AuthUserClient = {
      id: 'usr_google_101',
      email: 'alex.creator@gmail.com',
      displayName: 'Alex Creator',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    };
    setUser(mockUser);
    setStoredUser(mockUser);
  };

  const signInWithGithub = async () => {
    const mockUser: AuthUserClient = {
      id: 'usr_github_202',
      email: 'dev@github.com',
      displayName: 'Dev Engineer',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    };
    setUser(mockUser);
    setStoredUser(mockUser);
  };

  const signOut = async () => {
    setUser(null);
    setStoredUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signInWithGithub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
