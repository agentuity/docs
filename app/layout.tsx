import { RootProvider } from "fumadocs-ui/provider";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import type { Metadata } from 'next';
import { validateEnv } from "@/lib/env";
import "./global.css";

// Validate environment variables at startup (server-side only)
if (typeof window === 'undefined') {
	const isValid = validateEnv();
	if (!isValid) {
		console.warn('Environment validation failed during build – this is expected at build time');
	}
}

export const metadata: Metadata = {
	metadataBase: new URL('https://www.agentuity.dev'),
	title: 'Agentuity Docs',
	description:
		'Documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents.',
	applicationName: 'Agentuity Docs',
	authors: [{ name: 'Agentuity, Inc.' }],
	keywords: [
		'AI',
		'Agents',
		'Cloud Platform',
		'Deployment',
		'Management',
		'Scaling',
	],
	referrer: 'origin-when-cross-origin',
	creator: 'Agentuity, Inc.',
	publisher: 'Agentuity, Inc.',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
		},
	},
	alternates: {
		canonical: 'https://www.agentuity.dev',
		languages: {
			'en-US': 'https://www.agentuity.dev',
		},
	},
	icons: {
		icon: '/favicon.ico',
		shortcut: '/favicon.ico',
		apple: '/apple-touch-icon.png',
	},
	manifest: '/manifest.json',
	openGraph: {
		title: 'Agentuity Docs',
		description:
			'Documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents.',
		url: 'https://www.agentuity.dev',
		siteName: 'Agentuity Docs',
		images: [
			{
				url: '/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Agentuity Docs',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		site: '@agentuity',
		creator: '@agentuity',
		title: 'Agentuity Docs',
		description:
			'Documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents.',
		images: ['/og-image.png'],
	},
	appleWebApp: {
		capable: undefined,
		title: 'Agentuity Docs',
		statusBarStyle: 'black-translucent',
	},
	abstract: 'Documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents.',
	category: 'technology',
	classification: 'Business Software',
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={GeistSans.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen antialiased">
				<RootProvider 
					theme={{ enabled: true, enableSystem: true }}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
