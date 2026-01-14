'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

const EXPLORER_URL = 'https://explorer.agentuity.dev';

export function SDKExplorerIframe() {
	const { resolvedTheme } = useTheme();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [mounted, setMounted] = useState(false);
	const [iframeLoaded, setIframeLoaded] = useState(false);
	// Capture initial theme for iframe src (don't change src on theme updates)
	const [initialTheme] = useState(() =>
		typeof window !== 'undefined'
			? document.documentElement.classList.contains('dark')
				? 'dark'
				: 'light'
			: 'dark'
	);

	// Only render iframe after mount to avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Send theme changes to iframe via postMessage
	useEffect(() => {
		if (mounted && iframeRef.current?.contentWindow) {
			iframeRef.current.contentWindow.postMessage(
				{ type: 'SET_THEME', theme: resolvedTheme },
				EXPLORER_URL
			);
		}
	}, [resolvedTheme, mounted]);

	// Listen for navigation requests from iframe
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			// Validate origin to prevent open redirect
			if (event.origin !== new URL(EXPLORER_URL).origin) {
				return;
			}
			if (event.data?.type === 'NAVIGATE' && event.data.path) {
				const path = event.data.path;
				// Only allow relative paths to prevent open redirects
				if (
					typeof path === 'string' &&
					path.startsWith('/') &&
					!path.startsWith('//')
				) {
					window.location.href = path;
				}
			}
		};
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	// Show placeholder until mounted to avoid hydration mismatch
	if (!mounted) {
		return <div className="w-full h-full bg-fd-background animate-pulse" />;
	}

	return (
		<iframe
			ref={iframeRef}
			src={`${EXPLORER_URL}?theme=${initialTheme}`}
			title="SDK Explorer"
			allow="clipboard-read; clipboard-write"
			onLoad={() => setIframeLoaded(true)}
			className={`transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
		/>
	);
}
