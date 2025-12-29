'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start loading whenever auth state is loading.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    
    // If auth is done but there's no user, we are done loading.
    if (!firestore || !authUser) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    // Auth is ready and we have a user, now listen to their profile document.
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        // The user is authenticated, but their profile doc doesn't exist.
        // This can happen, so we set profile to null and stop loading.
        setUserProfile(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("useUserProfile snapshot error:", error);
      setUserProfile(null);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firestore, authUser, isAuthLoading]);

  return { userProfile, isLoading };
}
