'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { useUser } from '@/firebase';

export function AppLayout({ children }: { children: React.ReactNode }) {
  // This layout is now only rendered for authenticated users,
  // so we don't need to check for the user here anymore.

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarNav />
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">{children}</SidebarInset>
    </SidebarProvider>
  );
}
