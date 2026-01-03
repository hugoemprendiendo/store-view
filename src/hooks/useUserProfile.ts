
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// This function cleans up the assignedBranches field, ensuring it's a valid Record<string, boolean>.
// It handles cases where the data might be corrupted with array-like keys ("0", "1", etc.).
const sanitizeAssignedBranches = (branches: any): Record<string, boolean> => {
    if (!branches || typeof branches !== 'object') {
        return {};
    }

    const cleanedBranches: Record<string, boolean> = {};
    for (const key in branches) {
        // We only keep keys that have a value of `true` and are not numeric strings (like array indices).
        // This effectively filters out old, corrupted array-like entries.
        if (branches[key] === true && isNaN(parseInt(key))) {
            cleanedBranches[key] = true;
        }
    }
    return cleanedBranches;
};


export function useUserProfile() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start loading and don't stop until we have a definitive answer.
    setIsLoading(true);

    if (isAuthLoading) {
      // Auth state is not yet determined, so we wait.
      return;
    }
    
    // Auth is done. If there's no authenticated user, there's no profile to fetch.
    if (!firestore || !authUser) {
      setUserProfile(null);
      setIsLoading(false); // We are done loading.
      return;
    }

    // Auth is ready and we have a user. Start listening to their profile document.
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const profileData = snapshot.data();
        
        // Sanitize the assignedBranches field before setting the state.
        const sanitizedProfile: UserProfile = {
            id: snapshot.id,
            ...profileData,
            assignedBranches: sanitizeAssignedBranches(profileData.assignedBranches),
        } as UserProfile;

        setUserProfile(sanitizedProfile);

      } else {
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

    // Cleanup subscription on unmount.
    return () => unsubscribe();
  }, [firestore, authUser, isAuthLoading]);

  return { userProfile, isLoading };
}
