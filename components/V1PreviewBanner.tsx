'use client';

import { Info } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function V1PreviewBanner() {
	const pathname = usePathname();

	if (!pathname?.startsWith('/v1')) {
		return null;
	}

	return (
		<div className="flex items-center leading-tight gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-2 text-sm text-blue-700 dark:text-blue-400">
			<Info className="h-4 w-4 shrink-0" />
			<span>
				The v1 SDK is in preview.
				<br />
				Your feedback helps shape it.
			</span>
		</div>
	);
}
