
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
        <Header title="Page Not Found" />
        <div className="flex flex-col items-center justify-center gap-6 rounded-lg border bg-card text-card-foreground shadow-sm p-10 text-center">
            <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
            <p className="text-muted-foreground">
                Sorry, the page you are looking for does not exist.
            </p>
            <Button asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                </Link>
            </Button>
        </div>
    </div>
  );
}
