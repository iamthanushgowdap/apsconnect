"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile, Semester, NotificationPreferences } from '@/types'; 
import { useToast } from '@/hooks/use-toast';
import { SiteConfig } from '@/config/site'; 
import { UpdateNotificationToast } from '@/components/notifications/update-notification-toast';
import { useRouter } from 'next/navigation';


export interface User {
  uid: string; 
  email: string | null; 
  displayName: string | null;
  role: UserRole;
  branch?: Branch; 
  usn?: string; 
  assignedBranches?: Branch[]; 
  assignedSemesters?: Semester[]; 
  rejectionReason?: string; 
  semester?: Semester; 
  avatarDataUrl?: string; 
  pronouns?: string;
  notificationPreferences?: NotificationPreferences;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; semester?: Semester; password?: string; pronouns?: string; }) => Promise<User>; 
  signOut: () => Promise<void>;
  updateUserContext: (updatedUser: User) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const defaultNotificationPreferences: NotificationPreferences = {
    news: true,
    events: true,
    notes: true,
    schedules: true,
    general: true,
  };


  useEffect(() => {
    setIsLoading(true);
    try {
      const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('mockUser') : null;
      if (mockUserStr) {
        const storedUser = JSON.parse(mockUserStr) as User; 
        // Ensure notificationPreferences are set
        if (!storedUser.notificationPreferences) {
          const profileKey = `apsconnect_user_${storedUser.uid}`;
          const profileStr = typeof window !== 'undefined' ? localStorage.getItem(profileKey) : null;
          if (profileStr) {
            const fullProfile = JSON.parse(profileStr) as UserProfile;
            storedUser.notificationPreferences = fullProfile.notificationPreferences || defaultNotificationPreferences;
          } else {
            storedUser.notificationPreferences = defaultNotificationPreferences;
          }
        }
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

  const signIn = async (credentials: { email?: string; usn?: string; role: UserRole; displayName?: string; branch?: Branch; semester?: Semester; password?: string; pronouns?: string }): Promise<User> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let newUser: User;
    const defaultDisplayName = credentials.displayName || 
      (credentials.email ? credentials.email.split('@')[0] : 
      (credentials.usn ? `User-${credentials.usn.slice(-3)}` : 'User'));
    
    let userProfileData: UserProfile | null = null;
    const profileKey = `apsconnect_user_${credentials.email?.toLowerCase() || credentials.usn?.toUpperCase()}`;
    const profileStr = typeof window !== 'undefined' ? localStorage.getItem(profileKey) : null;
    if (profileStr) {
        userProfileData = JSON.parse(profileStr) as UserProfile;
    }


    if (credentials.role === 'admin' && credentials.email) {
      newUser = {
        uid: credentials.email, 
        email: credentials.email,
        displayName: userProfileData?.displayName || defaultDisplayName,
        role: credentials.role,
        avatarDataUrl: userProfileData?.avatarDataUrl,
        pronouns: userProfileData?.pronouns,
        notificationPreferences: userProfileData?.notificationPreferences || defaultNotificationPreferences,
      };
    } else if (credentials.role === 'faculty' && credentials.email && credentials.password) {
      if (userProfileData && userProfileData.role === 'faculty' && userProfileData.password === credentials.password) {
          newUser = {
            uid: userProfileData.uid,
            email: userProfileData.email,
            displayName: userProfileData.displayName || defaultDisplayName,
            role: 'faculty',
            branch: userProfileData.assignedBranches && userProfileData.assignedBranches.length > 0 ? userProfileData.assignedBranches[0] : undefined,
            assignedBranches: userProfileData.assignedBranches,
            assignedSemesters: userProfileData.assignedSemesters,
            avatarDataUrl: userProfileData.avatarDataUrl,
            pronouns: userProfileData.pronouns,
            notificationPreferences: userProfileData.notificationPreferences || defaultNotificationPreferences,
          };
        } else {
          setIsLoading(false);
          throw new Error("Invalid faculty credentials or account not found.");
        }
    } else if (credentials.role === 'student' && credentials.usn) {
       if(userProfileData){
         if (userProfileData.isApproved && userProfileData.role === 'student') {
           if (credentials.password !== userProfileData.password) {
             setIsLoading(false);
             throw new Error("Invalid student credentials.");
           }
         } else if (!userProfileData.isApproved && userProfileData.role === 'pending' && credentials.password !== userProfileData.password) {
           // Allow login for pending users even if password check is initially for approved
         }

        newUser = {
            uid: credentials.usn.toUpperCase(), 
            usn: credentials.usn.toUpperCase(),
            email: userProfileData.email, 
            displayName: userProfileData.displayName || defaultDisplayName,
            role: userProfileData.role, 
            branch: userProfileData.branch, 
            semester: userProfileData.semester,
            avatarDataUrl: userProfileData.avatarDataUrl,
            pronouns: userProfileData.pronouns,
            rejectionReason: userProfileData.rejectionReason,
            notificationPreferences: userProfileData.notificationPreferences || defaultNotificationPreferences,
        };
       } else {
          setIsLoading(false);
          throw new Error("Student account not found. Please register first.");
       }
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
    router.push('/login'); // Navigate to login page after sign out
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
