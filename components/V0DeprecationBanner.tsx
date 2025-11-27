'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export function V0DeprecationBanner() {
	const pathname = usePathname();

	if (!pathname?.startsWith('/v0')) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
			<AlertTriangle className="h-4 w-4 shrink-0" />
			<span>
				v0 is deprecated.{' '}
				<Link
					href="/v1/migration-guide"
					className="font-medium underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300"
				>
					Migrate to v1
				</Link>
			</span>
		</div>
	);
}
