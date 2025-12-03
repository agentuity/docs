'use client';

import Link from 'fumadocs-core/link';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { useSidebar } from 'fumadocs-ui/contexts/sidebar';
import { Check, ChevronsUpDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { twMerge as cn } from 'tailwind-merge';

interface Option {
	url: string; // Link destination
	matchUrl: string; // Base path for matching current page
	title: string;
	description?: string;
}

interface VersionToggleProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	options: Option[];
}

function isActive(url: string, pathname: string, nested: boolean): boolean {
	return nested ? pathname.startsWith(url) : pathname === url;
}

export function VersionToggle({ options, ...props }: VersionToggleProps) {
	const [open, setOpen] = useState(false);
	const { closeOnRedirect } = useSidebar();
	const pathname = usePathname();

	const selected = useMemo(() => {
		return options.findLast((item) => isActive(item.matchUrl, pathname, true));
	}, [options, pathname]);

	const onClick = () => {
		closeOnRedirect.current = false;
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{selected && (
				<PopoverTrigger
					{...props}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 px-2 py-2 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground',
						props.className
					)}
				>
					<div>
						<p className="text-sm font-medium">{selected.title}</p>
						<p className="text-[13px] text-fd-muted-foreground empty:hidden md:hidden">
							{selected.description}
						</p>
					</div>
					<ChevronsUpDown className="ms-auto size-4 text-fd-muted-foreground" />
				</PopoverTrigger>
			)}
			<PopoverContent className="flex min-w-[var(--radix-popover-trigger-width)] flex-col gap-1 overflow-hidden p-1">
				{options.map((item) => {
					const active = item === selected;
					return (
						<Link
							key={item.url}
							href={item.url}
							onClick={onClick}
							className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-fd-accent hover:text-fd-accent-foreground"
						>
							<div>
								<p className="text-sm font-medium">{item.title}</p>
								<p className="text-[13px] text-fd-muted-foreground empty:hidden">
									{item.description}
								</p>
							</div>
							<Check
								className={cn(
									'ms-auto size-3.5 text-fd-primary',
									!active && 'invisible'
								)}
							/>
						</Link>
					);
				})}
			</PopoverContent>
		</Popover>
	);
}
