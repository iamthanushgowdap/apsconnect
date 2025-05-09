"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile, Semester } from '@/types'; 
import { useToast } from '@/hooks/use-toast';
import { SiteConfig } from '@/config/site'; 
import { UpdateNotificationToast } from '@/components/notifications/update-notification-toast';


export interface User {
  uid: string; 
  email: string | null; 
  displayName: string | null;
  role: UserRole;
  branch?: Branch; 
  usn?: string; 
  assignedBranches?: Branch[]; 
  assignedSemesters?: Semester[]; // Added assignedSemesters
  rejectionReason?: string; 
  semester?: Semester; 
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; semester?: Semester; password?: string }) => Promise<User>; 
  signOut: () => Promise<void>;
  updateUserContext: (updatedUser: User) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


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

    if (typeof window !== 'undefined') {
      const APP_VERSION_KEY = 'apsconnect_app_version';
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);

      if (storedVersion !== SiteConfig.LATEST_APP_VERSION) { 
        const toastCtrl = toast({ 
          duration: Infinity, 
          variant: 'raw',
          description: ( 
            <UpdateNotificationToast
              onUpdate={() => {
                localStorage.setItem(APP_VERSION_KEY, SiteConfig.LATEST_APP_VERSION); 
                toastCtrl.dismiss(); 
                window.location.reload(); 
              }}
              onDismiss={() => {
                localStorage.setItem(APP_VERSION_KEY, SiteConfig.LATEST_APP_VERSION); 
                toastCtrl.dismiss();
              }}
            />
          ),
        });
      }
    }

  }, [toast]); 

  const signIn = async (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; semester?: Semester; password?: string }): Promise<User> => {
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
      const facultyUserKey = `apsconnect_user_${credentials.email.toLowerCase()}`;
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
            assignedSemesters: facultyProfile.assignedSemesters, // Populate assignedSemesters
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
       const registeredUserKey = `apsconnect_user_${credentials.usn.toUpperCase()}`;
       const registeredUserDataStr = typeof window !== 'undefined' ? localStorage.getItem(registeredUserKey) : null;
       let studentEmail: string | null = null;
       let studentDisplayName: string | null = defaultDisplayName;
       let studentBranch: Branch | undefined = undefined; 
       let studentSemester: Semester | undefined = undefined;
       let isApproved = false;
       let currentRole: UserRole = 'pending';
       let rejectionReason: string | undefined = undefined;


       if(registeredUserDataStr){
         const registeredUserData = JSON.parse(registeredUserDataStr) as UserProfile;
         if (registeredUserData.isApproved && registeredUserData.role === 'student') {
           if (credentials.password !== registeredUserData.password) {
             setIsLoading(false);
             throw new Error("Invalid student credentials.");
           }
         } else if (!registeredUserData.isApproved && registeredUserData.role === 'pending' && credentials.password !== registeredUserData.password) {
           // Allow login for pending users even if password check is initially for approved
           // This allows them to see pending/rejected status
           // If strict password check for pending is needed, adjust here
         }


         studentEmail = registeredUserData.email;
         studentDisplayName = registeredUserData.displayName || defaultDisplayName;
         isApproved = registeredUserData.isApproved;
         currentRole = registeredUserData.role; 
         studentBranch = registeredUserData.branch; 
         studentSemester = registeredUserData.semester;
         if (!isApproved && registeredUserData.rejectionReason) {
            rejectionReason = registeredUserData.rejectionReason;
         }
       } else {
          setIsLoading(false);
          throw new Error("Student account not found. Please register first.");
       }

      newUser = {
        uid: credentials.usn.toUpperCase(), 
        usn: credentials.usn.toUpperCase(),
        email: studentEmail, 
        displayName: studentDisplayName,
        role: currentRole, 
        branch: studentBranch, 
        semester: studentSemester,
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

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    }
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUserContext }}>
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
