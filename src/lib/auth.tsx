
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole, Mentor } from '@/types';
import { getUserProfileById, createUserProfile } from '@/lib/queries';
import { auth } from './firebase';
import { Skeleton } from '@/components/ui/skeleton';

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup', '/'];

// --- Standalone Auth Functions ---
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in Firestore, if not, create a profile.
        let profile = await getUserProfileById(user.uid);
        if (!profile) {
            // Defaulting new Google sign-ups to 'learner' role.
            // A more robust solution might ask for the role on first login.
            profile = await createUserProfile(user.uid, {
                name: user.displayName || 'New User',
                email: user.email || '',
                role: 'learner', // Default role
            });
        }
        return { user: profile };

    } catch (error: any) {
        console.error("Error during Google sign-in:", error);
        // Handle specific errors (e.g., popup closed by user) if needed
        if (error.code === 'auth/popup-closed-by-user') {
          return { error: 'The sign-in process was cancelled.'}
        }
        return { error: error.message || "An unknown error occurred." };
    }
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthChange = useCallback(async (fbUser: FirebaseUser | null) => {
    setLoading(true);
    if (fbUser) {
      setFirebaseUser(fbUser);
      const profile = await getUserProfileById(fbUser.uid);
      
      if (profile) {
        setUser(profile as User | null);
        setRole(profile?.role || null);
        // If user is on an auth page, redirect to dashboard
        if (publicRoutes.includes(pathname)) {
          router.replace('/dashboard');
        }
      } else {
        // This case might happen if a user is created in Auth but not in Firestore yet
        // e.g. first time Google sign in, handled by signInWithGoogle, but good to have a fallback.
        console.log("No profile found for authenticated user, creating one.");
         const newProfile = await createUserProfile(fbUser.uid, {
            name: fbUser.displayName || "New User",
            email: fbUser.email!,
            role: "learner" // Default role
        });
        setUser(newProfile as User);
        setRole("learner");
         if (publicRoutes.includes(pathname)) {
          router.replace('/dashboard');
        }
      }

    } else {
      // No Firebase user
      setFirebaseUser(null);
      setUser(null);
      setRole(null);
      // If user is on a protected page, redirect to login
      if (!publicRoutes.includes(pathname)) {
        router.replace('/login');
      }
    }
    setLoading(false);
  }, [router, pathname]);
  
  const refreshAuth = useCallback(async () => {
      if (firebaseUser) {
          const profile = await getUserProfileById(firebaseUser.uid);
          if (profile) {
            setUser(profile as User | null);
            setRole(profile?.role || null);
          }
      }
  }, [firebaseUser]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, [handleAuthChange]);

  const logout = async () => {
    await auth.signOut();
    // onAuthStateChanged will handle the rest (redirecting to /login)
  };

  const value = {
    user,
    firebaseUser,
    role,
    loading,
    logout,
    refreshAuth
  };
  
  if (loading && publicRoutes.includes(pathname)) {
    // Still show a loading state for public pages to avoid flashing content
     return (
           <div className="flex h-screen w-screen items-center justify-center">
             <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                  </div>
              </div>
          </div>
      )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
