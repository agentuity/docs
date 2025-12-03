'use client';

import { usePathname } from 'next/navigation';
import { V1PreviewBanner } from './V1PreviewBanner';
import { VersionToggle } from './VersionToggle';

// Version switcher options
// - url: where to navigate when selected
// - matchUrl: base path for determining active state
const versionOptions = [
	{ url: '/v0/Introduction', matchUrl: '/v0', title: 'Current', description: 'Agentuity SDK 0.x' },
	{ url: '/v1/Get-Started/what-is-agentuity', matchUrl: '/v1', title: 'Preview', description: 'Agentuity SDK 1.x' },
];

export function SidebarBanner() {
	const pathname = usePathname();
	const isV1 = pathname.startsWith('/v1');

	return (
		<>
			{isV1 && <V1PreviewBanner />}
			<VersionToggle options={versionOptions} className="mb-2" />
		</>
	);
}
