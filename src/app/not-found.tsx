
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
        <Header title="Página No Encontrada" />
        <div className="flex flex-col items-center justify-center gap-6 rounded-lg border bg-card text-card-foreground shadow-sm p-10 text-center">
            <h2 className="text-2xl font-bold">404 - Página No Encontrada</h2>
            <p className="text-muted-foreground">
                Lo sentimos, la página que buscas no existe.
            </p>
            <Button asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir al Panel de Control
                </Link>
            </Button>
        </div>
    </div>
  );
}
