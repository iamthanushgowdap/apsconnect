
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile } from '@/types'; 

export interface User {
  uid: string; 
  email: string | null; 
  displayName: string | null;
  role: UserRole;
  branch?: Branch; // For students: their branch. For faculty: their primary/first assigned branch for display.
  usn?: string; 
  assignedBranches?: Branch[]; // For faculty, to know all their branches
  rejectionReason?: string; // Added to show rejection reason to the user
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; password?: string }) => Promise<User>; // Return User on success
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

  const signIn = async (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; password?: string }): Promise<User> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let newUser: User;
    const defaultDisplayName = credentials.displayName || 
      (credentials.email ? credentials.email.split('@')[0] : 
      (credentials.usn ? `User-${credentials.usn.slice(-3)}` : 'User'));

    if (credentials.role === 'admin' && credentials.email) {
      newUser = {
        uid: credentials.email, 
        email: credentials.email,
        displayName: defaultDisplayName,
        role: credentials.role,
      };
    } else if (credentials.role === 'faculty' && credentials.email && credentials.password) {
      const facultyUserKey = `campus_connect_user_${credentials.email.toLowerCase()}`;
      const facultyUserDataStr = typeof window !== 'undefined' ? localStorage.getItem(facultyUserKey) : null;

      if (facultyUserDataStr) {
        const facultyProfile = JSON.parse(facultyUserDataStr) as UserProfile;
        if (facultyProfile.role === 'faculty' && facultyProfile.password === credentials.password) {
          newUser = {
            uid: facultyProfile.uid,
            email: facultyProfile.email,
            displayName: facultyProfile.displayName || defaultDisplayName,
            role: 'faculty',
            branch: facultyProfile.assignedBranches && facultyProfile.assignedBranches.length > 0 ? facultyProfile.assignedBranches[0] : undefined,
            assignedBranches: facultyProfile.assignedBranches,
          };
        } else {
          setIsLoading(false);
          throw new Error("Invalid faculty credentials or account not found.");
        }
      } else {
        setIsLoading(false);
        throw new Error("Faculty account not found.");
      }
    } else if (credentials.role === 'student' && credentials.usn) {
       const registeredUserKey = `campus_connect_user_${credentials.usn.toUpperCase()}`;
       const registeredUserDataStr = typeof window !== 'undefined' ? localStorage.getItem(registeredUserKey) : null;
       let studentEmail: string | null = null;
       let studentDisplayName: string | null = defaultDisplayName;
       let studentBranch: Branch | undefined = undefined; // Branch will be determined by stored profile
       let isApproved = false;
       let currentRole: UserRole = 'pending';
       let rejectionReason: string | undefined = undefined;


       if(registeredUserDataStr){
         const registeredUserData = JSON.parse(registeredUserDataStr) as UserProfile;
         studentEmail = registeredUserData.email;
         studentDisplayName = registeredUserData.displayName || defaultDisplayName;
         isApproved = registeredUserData.isApproved;
         currentRole = registeredUserData.role; // Use current role from storage
         studentBranch = registeredUserData.branch; // Branch is from stored profile data
         if (!isApproved && registeredUserData.rejectionReason) {
            rejectionReason = registeredUserData.rejectionReason;
         }
       } else {
          // Student record not found in localStorage.
          // This implies they haven't registered or data is missing.
          // They will default to a 'pending' status with minimal info.
          // Branch remains undefined as it cannot be derived from USN.
       }

      newUser = {
        uid: credentials.usn.toUpperCase(), 
        usn: credentials.usn.toUpperCase(),
        email: studentEmail, 
        displayName: studentDisplayName,
        role: currentRole, 
        branch: studentBranch, // Branch comes from stored profile, or undefined if no profile
        rejectionReason,
      };
    } else {
      setIsLoading(false);
      throw new Error("Invalid credentials for signIn: email/USN or password missing for role, or role not specified.");
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(newUser)); 
    }
    setUser(newUser);
    setIsLoading(false);
    return newUser;
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

