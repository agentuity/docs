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
			destination: '/v1/Get-Started/what-is-agentuity',
			permanent: false,
		},
		{
			source: '/docs',
			destination: '/v1/Get-Started/what-is-agentuity',
			permanent: true,
		},
		{
			source: '/v0/:path*',
			destination: '/v1/Get-Started/what-is-agentuity',
			permanent: true,
		},
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
