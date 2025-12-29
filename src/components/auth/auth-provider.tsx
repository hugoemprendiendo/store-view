'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '../layout/app-layout';

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user status to be determined
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      // If user is not logged in and not on a public page, redirect to login
      router.push('/login');
    } else if (user && isPublicRoute) {
      // If user is logged in and tries to access login/signup, redirect to home
      router.push('/');
    }
  }, [user, isUserLoading, pathname, router]);

  // While checking user auth, show a global loader
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is not logged in and on a public route, show the page content without the main layout
  if (!user && publicRoutes.includes(pathname)) {
      return <>{children}</>;
  }

  // If user is logged in, show the page content within the main app layout
  if (user) {
      return <>{children}</>;
  }

  // Fallback for edge cases, e.g., user becomes null while on a private route before redirect happens
  // This usually shows the loader for a brief moment before the redirect kicks in.
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
