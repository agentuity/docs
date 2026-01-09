import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: ['twoslash', 'typescript'],
	redirects: async () => [
		{
			source: '/Get-Started/what-is-agentuity',
			destination: '/',
			permanent: false,
		},
		{
			source: '/Introduction',
			destination: '/',
			permanent: true,
		},
		{
			source: '/Get-Started',
			destination: '/Get-Started/installation',
			permanent: true,
		},
		// Legacy /Build/ paths
		{
			source: '/Build/Sandbox/:path*',
			destination: '/Services/Sandbox/:path*',
			permanent: true,
		},
		{
			source: '/Build/Observability/:path*',
			destination: '/Services/Observability/:path*',
			permanent: true,
		},
		{
			source: '/Build/Storage/:path*',
			destination: '/Services/Storage/:path*',
			permanent: true,
		},
		// Everything else under /Build/ just drops the prefix
		{
			source: '/Build/:path*',
			destination: '/:path*',
			permanent: true,
		},
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
