"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// In a real app, you'd import Firebase auth functions here
// import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
// import { auth } from '@/lib/firebase'; // Your Firebase config

// Define the shape of your user object and auth context
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'student' | 'admin' | 'pending'; // Example roles
  branch?: string; // Example custom claim or Firestore data
  // Add other relevant user properties
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  // Add other auth functions like signIn, signOut, signUp, etc.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This is where you'd integrate Firebase's onAuthStateChanged
    // For now, simulate loading and no user
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Example: Check local storage for a mock user for UI dev
      const mockUserStr = localStorage.getItem('mockUser');
      if (mockUserStr) {
        try {
          const mockUser = JSON.parse(mockUserStr) as User;
          setUser(mockUser);
        } catch (e) {
          localStorage.removeItem('mockUser');
        }
      }
    }, 1000); // Simulate async loading

    // const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    //   if (firebaseUser) {
    //     // Here, you might fetch additional user data from Firestore (like role, branch)
    //     // const tokenResult = await firebaseUser.getIdTokenResult();
    //     // const role = tokenResult.claims.role || 'student'; // Example: role from custom claims
    //     // const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid)); // Fetch from Firestore
    //     // const branch = userDoc.exists() ? userDoc.data().branch : undefined;
    //     setUser({
    //       uid: firebaseUser.uid,
    //       email: firebaseUser.email,
    //       displayName: firebaseUser.displayName,
    //       role: 'student', // Placeholder, fetch actual role
    //       // branch: branch,
    //     });
    //   } else {
    //     setUser(null);
    //   }
    //   setIsLoading(false);
    // });
    // return () => unsubscribe();
     return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // For UI development, provide mock login/logout if context.user is not set from localStorage
  // This part is tricky as AuthProvider is server-side for initial render, client-side for effects.
  // The Navbar's useMockAuth is a simpler client-side only approach for UI dev.
  // A full solution requires proper state management or passing setters down.
  return context;
};
