
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch } from '@/types'; 

export interface User {
  uid: string; // For student, this will be USN. For admin/faculty, email.
  email: string | null; // Student email collected at registration, admin/faculty must have one.
  displayName: string | null;
  role: UserRole;
  branch?: Branch; // Can be derived from USN for students
  usn?: string; // Store the full USN for students
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; password?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('mockUser') : null;
      if (mockUserStr) {
        const storedUser = JSON.parse(mockUserStr) as User; 
        setUser(storedUser);
      } else {
        setUser(null); 
      }
    } catch (e) {
      console.error("Failed to parse mockUser from localStorage", e);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mockUser'); 
      }
      setUser(null); 
    } finally {
      setIsLoading(false); 
    }
  }, []);

  const signIn = async (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; password?: string }) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let newUser: User;
    const commonDisplayName = credentials.displayName || 
      (credentials.email ? credentials.email.split('@')[0] : 
      (credentials.usn ? `User-${credentials.usn.slice(-3)}` : 'User'));

    if ((credentials.role === 'admin' || credentials.role === 'faculty') && credentials.email) {
      newUser = {
        uid: credentials.email, 
        email: credentials.email,
        displayName: commonDisplayName,
        role: credentials.role, // Will be 'admin' or 'faculty'
        // No USN or branch for admin/faculty by default here
      };
    } else if (credentials.role === 'student' && credentials.usn) {
       const registeredUserKey = `campus_connect_user_${credentials.usn.toUpperCase()}`;
       const registeredUserDataStr = typeof window !== 'undefined' ? localStorage.getItem(registeredUserKey) : null;
       let studentEmail: string | null = null;
       let studentDisplayName: string | null = commonDisplayName;
       let studentBranch: Branch | undefined = credentials.branch;

       if(registeredUserDataStr){
         const registeredUserData = JSON.parse(registeredUserDataStr);
         studentEmail = registeredUserData.email;
         studentDisplayName = registeredUserData.displayName || commonDisplayName;
         // studentBranch can also be derived from USN, e.g. credentials.usn.substring(5,7) as Branch code
         if(!studentBranch && credentials.usn.length >= 7) {
            const branchCode = credentials.usn.substring(5,7).toUpperCase() as Branch; // Assuming USN is 1APYYBBBNNN format
            if (["CSE", "ISE", "ECE", "ME", "CIVIL", "OTHER"].includes(branchCode)) {
                 studentBranch = branchCode;
            }
         }
       }

      newUser = {
        uid: credentials.usn.toUpperCase(), 
        usn: credentials.usn.toUpperCase(),
        email: studentEmail, 
        displayName: studentDisplayName,
        role: credentials.role,
        branch: studentBranch, 
      };
    } else {
      setIsLoading(false);
      throw new Error("Invalid credentials for signIn: email/USN missing for role, or role not specified.");
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(newUser)); 
    }
    setUser(newUser);
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser');
    }
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

