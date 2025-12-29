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
    // Always start in a loading state if auth is still loading.
    setIsLoading(isAuthLoading);

    if (isAuthLoading) {
      return;
    }
    
    // If auth is done but there's no user, we are done loading. No profile to fetch.
    if (!firestore || !authUser) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    // At this point, auth is ready and we have a user. Start listening to their profile.
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        // The user is authenticated, but their profile doc doesn't exist.
        // This is a valid state, so we set profile to null.
        setUserProfile(null);
      }
      // We are done loading only after the first snapshot is processed.
      setIsLoading(false);
    }, (error) => {
      console.error("useUserProfile snapshot error:", error);
      setUserProfile(null);
      // We are also done loading if there's an error.
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firestore, authUser, isAuthLoading]);

  return { userProfile, isLoading };
}
