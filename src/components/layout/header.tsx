import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90 font-headline">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
