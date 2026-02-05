import { ExternalLink } from 'lucide-react';
import type { ReactNode, CSSProperties } from 'react';

interface ExternalCardProps {
  href: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function ExternalCard({ href, title, icon, children, style, className }: ExternalCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`not-prose block rounded-lg border p-4 shadow-md transition-colors ${className || 'bg-fd-card text-fd-card-foreground hover:bg-fd-accent/80'}`}
      style={style}
    >
      <div className="flex items-start gap-3">
        {icon && <div>{icon}</div>}
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium">
            {title}
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </div>
          <span className="mt-1 block text-sm opacity-80">{children}</span>
        </div>
      </div>
    </a>
  );
}
