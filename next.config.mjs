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
			destination: '/Introduction',
			permanent: true,
		},
		{
			source: '/docs',
			destination: '/',
			permanent: true,
		},
	],
	rewrites: async () => [
		// Proxy session API calls to Agentuity V1 backend
		{
			source: '/api/sessions/:path*',
			destination: `${process.env.AGENT_BASE_URL}/api/sessions/:path*`,
		},
		// Proxy agent_pulse API calls to Agentuity V1 backend
		{
			source: '/api/agent_pulse',
			destination: `${process.env.AGENT_BASE_URL}/api/agent_pulse`,
		},
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
