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
			source: '/Get-Started/what-is-agentuity',
			destination: '/',
			permanent: false,
		},
		{
			source: '/Introduction',
			destination: '/',
			permanent: true,
		},
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
