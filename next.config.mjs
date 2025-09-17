import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: ['twoslash', 'typescript'],
	redirects: async () => [
		{
			source: '/',
			destination: '/Introduction',
			permanent: true,
		},
		{
			source: '/docs',
			destination: '/',
			permanent: true,
		},
	],
	webpack: (config, { isServer }) => {
		// Exclude agent-docs directory from webpack compilation to prevent
		// OpenTelemetry auto-instrumentations from loading in Cloudflare Workers
		config.module.rules.push({
			test: /agent-docs/,
			use: 'ignore-loader',
		});
		
		return config;
	},
};

export default withMDX(config);

initOpenNextCloudflareForDev();
