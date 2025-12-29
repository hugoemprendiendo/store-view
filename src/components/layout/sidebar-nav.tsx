'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Building2, LayoutGrid, Settings, Store, LogOut, Users, List } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';


const links = [
  { href: '/', label: 'Panel de Control', icon: LayoutGrid },
  { href: '/branches', label: 'Sucursales', icon: Building2 },
  { href: '/incidents', label: 'Incidencias', icon: List },
];

const adminLinks = [
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/settings', label: 'Configuración', icon: Settings }
]


export function SidebarNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const { toast } = useToast();
  const { userProfile, isLoading } = useUserProfile();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      // The AuthProvider will handle redirecting to /login
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: "No se pudo cerrar la sesión. Por favor, intenta de nuevo.",
      });
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Store className="size-7 text-accent" />
          <h2 className="text-xl font-bold text-foreground font-headline">
            StoreView
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(link.href) && (link.href === '/' ? pathname === '/' : true) }
                  tooltip={link.label}
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {!isLoading && userProfile?.role === 'superadmin' && adminLinks.map((link) => (
             <SidebarMenuItem key={link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(link.href)}
                  tooltip={link.label}
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Cerrar sesión">
                <LogOut />
                <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
