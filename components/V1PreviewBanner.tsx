'use client';

import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';

export function V1PreviewBanner() {
	const pathname = usePathname();

	if (!pathname?.startsWith('/v1')) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-700 dark:text-blue-400">
			<Info className="h-4 w-4 shrink-0" />
			<span>v1 is in preview. Feedback welcome!</span>
		</div>
	);
}
