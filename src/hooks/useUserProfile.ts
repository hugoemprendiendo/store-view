'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!firestore || !authUser) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUserProfile({ id: userDocSnap.id, ...userDocSnap.data() } as UserProfile);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    }

    if (!isUserLoading) {
      fetchUserProfile();
    }
  }, [firestore, authUser, isUserLoading]);

  return { userProfile, isLoading: isLoading || isUserLoading };
}
