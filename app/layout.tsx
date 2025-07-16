import { RootProvider } from "fumadocs-ui/provider";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import type { Metadata } from 'next';
import { validateEnv } from "@/lib/env";
import Script from 'next/script';
import "./global.css";

// Validate environment variables at startup (server-side only)
if (typeof window === 'undefined') {
	validateEnv();
}

export const metadata: Metadata = {
	metadataBase: new URL('https://www.agentuity.dev'),
	title: 'Agentuity Documentation — Complete guide to AI agent deployment',
	description:
		'Comprehensive documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents. Learn how to build, deploy, and manage autonomous agents with our CLI, SDKs, and cloud infrastructure.',
	applicationName: 'Agentuity Docs',
	authors: [{ name: 'Agentuity, Inc.' }],
	keywords: [
		'AI agents documentation',
		'artificial intelligence',
		'cloud platform',
		'agent deployment guide',
		'AI infrastructure',
		'autonomous agents',
		'LangChain integration',
		'CrewAI integration',
		'agent management',
		'AI scaling',
		'machine learning operations',
		'MLOps',
		'agent orchestration',
		'AI automation',
		'intelligent agents',
		'API documentation',
		'SDK documentation',
		'CLI documentation',
		'tutorials',
		'examples',
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
		title: 'Agentuity Documentation — Complete guide to AI agent deployment',
		description:
			'Comprehensive documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents. Learn how to build, deploy, and manage autonomous agents.',
		url: 'https://www.agentuity.dev',
		siteName: 'Agentuity Docs',
		images: [
			{
				url: '/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Agentuity Documentation - Complete guide to AI agent deployment and management',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		site: '@agentuity',
		creator: '@agentuity',
		title: 'Agentuity Documentation — Complete guide to AI agent deployment',
		description:
			'Comprehensive documentation for Agentuity, the cloud platform purpose-built for deploying, managing, and scaling AI agents. Learn how to build, deploy, and manage autonomous agents.',
		images: ['/og-image.png'],
	},
	appleWebApp: {
		capable: undefined,
		title: 'Agentuity Docs',
		statusBarStyle: 'black-translucent',
	},
	abstract: 'Comprehensive technical documentation for Agentuity\'s AI agent cloud platform, including API references, SDK guides, CLI documentation, tutorials, and examples for building and deploying autonomous agents',
	category: 'technology',
	classification: 'Business Software',
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={GeistSans.className} suppressHydrationWarning>
			<head>
				<Script
					id="documentation-schema"
					type="application/ld+json"
					strategy="afterInteractive"
				>
					{`
					{
						"@context": "https://schema.org",
						"@type": "TechArticle",
						"headline": "Agentuity Documentation",
						"description": "Comprehensive technical documentation for Agentuity's AI agent cloud platform, including API references, SDK guides, CLI documentation, tutorials, and examples.",
						"author": {
							"@type": "Organization",
							"name": "Agentuity, Inc.",
							"url": "https://www.agentuity.com"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Agentuity, Inc.",
							"logo": {
								"@type": "ImageObject",
								"url": "https://www.agentuity.dev/og-image.png"
							}
						},
						"datePublished": "2024-01-01",
						"dateModified": "2024-12-01",
						"mainEntityOfPage": {
							"@type": "WebPage",
							"@id": "https://www.agentuity.dev"
						},
						"about": [
							{
								"@type": "Thing",
								"name": "AI Agents",
								"description": "Autonomous artificial intelligence systems"
							},
							{
								"@type": "Thing", 
								"name": "Cloud Computing",
								"description": "Distributed computing services over the internet"
							},
							{
								"@type": "Thing",
								"name": "Software Development",
								"description": "Process of creating and maintaining applications"
							}
						],
						"teaches": [
							"How to deploy AI agents to the cloud",
							"How to manage and scale autonomous agents",
							"How to integrate with AI frameworks like LangChain and CrewAI",
							"How to use Agentuity CLI and SDKs",
							"How to monitor and debug AI agents"
						]
					}
					`}
				</Script>
				<Script
					id="website-documentation-schema"
					type="application/ld+json"
					strategy="afterInteractive"
				>
					{`
					{
						"@context": "https://schema.org",
						"@type": "WebSite",
						"name": "Agentuity Documentation",
						"url": "https://www.agentuity.dev",
						"description": "Technical documentation for Agentuity's AI agent cloud platform",
						"publisher": {
							"@type": "Organization",
							"name": "Agentuity, Inc."
						},
						"potentialAction": {
							"@type": "SearchAction",
							"target": {
								"@type": "EntryPoint",
								"urlTemplate": "https://www.agentuity.dev/search?q={search_term_string}"
							},
							"query-input": "required name=search_term_string"
						},
						"mainEntity": {
							"@type": "CreativeWork",
							"name": "AI Agent Platform Documentation",
							"description": "Complete technical documentation covering APIs, SDKs, CLI tools, and tutorials for building and deploying AI agents",
							"author": {
								"@type": "Organization",
								"name": "Agentuity, Inc."
							},
							"audience": {
								"@type": "Audience",
								"audienceType": "Developers, AI Engineers, Data Scientists, Technical Writers"
							},
							"genre": "Technical Documentation"
						}
					}
					`}
				</Script>
				<Script
					id="breadcrumb-schema"
					type="application/ld+json"
					strategy="afterInteractive"
				>
					{`
					{
						"@context": "https://schema.org",
						"@type": "BreadcrumbList",
						"itemListElement": [
							{
								"@type": "ListItem",
								"position": 1,
								"name": "Home",
								"item": "https://www.agentuity.com"
							},
							{
								"@type": "ListItem",
								"position": 2,
								"name": "Documentation",
								"item": "https://www.agentuity.dev"
							}
						]
					}
					`}
				</Script>
			</head>
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
