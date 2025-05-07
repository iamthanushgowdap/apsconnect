"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch } from '@/types'; // Assuming UserRole and Branch types are defined

// Define the shape of your user object and auth context
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  branch?: Branch;
  // Add other relevant user properties
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; role?: UserRole, displayName?: string, branch?: Branch }) => Promise<void>;
  signOut: () => Promise<void>;
  // TODO: Add signUp if register page needs to interact with this context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize user from localStorage on mount
    setIsLoading(true);
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
      try {
        const storedUser = JSON.parse(mockUserStr) as User;
        setUser(storedUser);
      } catch (e) {
        console.error("Failed to parse mockUser from localStorage", e);
        localStorage.removeItem('mockUser');
      }
    }
    // Simulate async loading, even if user is found quickly or not at all
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced delay for better UX

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (credentials: { email: string; role?: UserRole, displayName?: string, branch?: Branch }) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      uid: credentials.email, // Using email as UID for mock purposes
      email: credentials.email,
      displayName: credentials.displayName || credentials.email.split('@')[0],
      role: credentials.role || 'student',
      branch: credentials.branch,
    };
    
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem('mockUser');
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

