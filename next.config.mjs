import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { createMDX } from 'fumadocs-mdx/next';
// empty pr 3 comment

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: ['twoslash', 'typescript'],
	redirects: async () => [
		{
			source: '/',
			destination: '/v0/Introduction',
			permanent: false,
		},
		{
			source: '/docs',
			destination: '/v0/Introduction',
			permanent: true,
		},
		// Redirect old v0 paths to new /v0/ prefix
		{
			source: '/Introduction/:path*',
			destination: '/v0/Introduction/:path*',
			permanent: true,
		},
		{
			source: '/Guides/:path*',
			destination: '/v0/Guides/:path*',
			permanent: true,
		},
		{
			source: '/Cloud/:path*',
			destination: '/v0/Cloud/:path*',
			permanent: true,
		},
		{
			source: '/CLI/:path*',
			destination: '/v0/CLI/:path*',
			permanent: true,
		},
		{
			source: '/SDKs/:path*',
			destination: '/v0/SDKs/:path*',
			permanent: true,
		},
		{
			source: '/Changelog/:path*',
			destination: '/v0/Changelog/:path*',
			permanent: true,
		},
		{
			source: '/Examples/:path*',
			destination: '/v0/Examples/:path*',
			permanent: true,
		},
		{
			source: '/Troubleshooting/:path*',
			destination: '/v0/Troubleshooting/:path*',
			permanent: true,
		},
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
