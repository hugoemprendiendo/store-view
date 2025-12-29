'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }
    if (!firestore || !authUser) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const userDocRef = doc(firestore, 'users', authUser.uid);

    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user profile with onSnapshot:", error);
      setUserProfile(null);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firestore, authUser, isUserLoading]);

  return { userProfile, isLoading: isLoading };
}
