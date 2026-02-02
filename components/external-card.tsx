import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

interface ExternalCardProps {
  href: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function ExternalCard({ href, title, icon, children }: ExternalCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose block rounded-lg border bg-fd-card p-4 text-fd-card-foreground shadow-md transition-colors hover:bg-fd-accent/80"
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-fd-muted-foreground">{icon}</div>}
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium">
            {title}
            <ExternalLink className="h-3.5 w-3.5 text-fd-muted-foreground" />
          </div>
          <span className="mt-1 block text-sm text-fd-muted-foreground">{children}</span>
        </div>
      </div>
    </a>
  );
}
