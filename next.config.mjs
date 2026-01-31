import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: ['twoslash', 'typescript'],
	redirects: async () => [
		{
			source: '/Introduction',
			destination: '/Get-Started/what-is-agentuity',
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
		{
			source: '/CLI/installation',
			destination: '/Get-Started/installation',
			permanent: true,
		},
		// =====================================================
		// Legacy v0 branch redirects
		// =====================================================

		// Introduction section
		{
			source: '/Introduction/index',
			destination: '/Get-Started/what-is-agentuity',
			permanent: true,
		},
		{
			source: '/Introduction/getting-started',
			destination: '/Get-Started/quickstart',
			permanent: true,
		},
		{
			source: '/Introduction/architecture',
			destination: '/Get-Started/project-structure',
			permanent: true,
		},
		{
			source: '/Introduction/templates',
			destination: '/Get-Started/quickstart',
			permanent: true,
		},
		{
			source: '/Introduction/kitchen-sink',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},
		{
			source: '/Introduction/:path*',
			destination: '/Get-Started/what-is-agentuity',
			permanent: true,
		},

		// CLI section
		{
			source: '/CLI/agent',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},
		{
			source: '/CLI/apikey',
			destination: '/Reference/CLI/configuration',
			permanent: true,
		},
		{
			source: '/CLI/auth',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},
		{
			source: '/CLI/bundle',
			destination: '/Reference/CLI/build-configuration',
			permanent: true,
		},
		{
			source: '/CLI/cloud',
			destination: '/Reference/CLI/deployment',
			permanent: true,
		},
		{
			source: '/CLI/dev',
			destination: '/Reference/CLI/development',
			permanent: true,
		},
		{
			source: '/CLI/env',
			destination: '/Reference/CLI/configuration',
			permanent: true,
		},
		{
			source: '/CLI/mcp',
			destination: '/Reference/CLI/ai-commands',
			permanent: true,
		},
		{
			source: '/CLI/project',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},
		{
			source: '/CLI/version',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},
		{
			source: '/CLI/:path*',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},

		// Cloud section
		{
			source: '/Cloud/index',
			destination: '/Services/Storage/key-value',
			permanent: true,
		},
		{
			source: '/Cloud/agents',
			destination: '/Agents/creating-agents',
			permanent: true,
		},
		{
			source: '/Cloud/aigateway',
			destination: '/Agents/ai-gateway',
			permanent: true,
		},
		{
			source: '/Cloud/api-keys',
			destination: '/Reference/CLI/configuration',
			permanent: true,
		},
		{
			source: '/Cloud/key-value-memory',
			destination: '/Services/Storage/key-value',
			permanent: true,
		},
		{
			source: '/Cloud/object-storage',
			destination: '/Services/Storage/object',
			permanent: true,
		},
		{
			source: '/Cloud/organization',
			destination: '/Get-Started/quickstart',
			permanent: true,
		},
		{
			source: '/Cloud/project',
			destination: '/Get-Started/project-structure',
			permanent: true,
		},
		{
			source: '/Cloud/settings',
			destination: '/Get-Started/app-configuration',
			permanent: true,
		},
		{
			source: '/Cloud/vector-memory',
			destination: '/Services/Storage/vector',
			permanent: true,
		},
		{
			source: '/Cloud/:path*',
			destination: '/Services/Storage/key-value',
			permanent: true,
		},

		// Guides section
		{
			source: '/Guides/agent-communication',
			destination: '/Agents/calling-other-agents',
			permanent: true,
		},
		{
			source: '/Guides/agent-data-handling',
			destination: '/Agents/state-management',
			permanent: true,
		},
		{
			source: '/Guides/agent-engineering',
			destination: '/Agents/creating-agents',
			permanent: true,
		},
		{
			source: '/Guides/agent-io',
			destination: '/Agents/streaming-responses',
			permanent: true,
		},
		{
			source: '/Guides/agent-logging',
			destination: '/Services/Observability/logging',
			permanent: true,
		},
		{
			source: '/Guides/agent-native-cloud',
			destination: '/Agents/creating-agents',
			permanent: true,
		},
		{
			source: '/Guides/agent-streaming',
			destination: '/Agents/streaming-responses',
			permanent: true,
		},
		{
			source: '/Guides/agent-telemetry',
			destination: '/Services/Observability/tracing',
			permanent: true,
		},
		{
			source: '/Guides/agent-tracing',
			destination: '/Services/Observability/tracing',
			permanent: true,
		},
		{
			source: '/Guides/ai-gateway',
			destination: '/Agents/ai-gateway',
			permanent: true,
		},
		{
			source: '/Guides/devmode',
			destination: '/Reference/CLI/development',
			permanent: true,
		},
		{
			source: '/Guides/key-value',
			destination: '/Services/Storage/key-value',
			permanent: true,
		},
		{
			source: '/Guides/object-storage',
			destination: '/Services/Storage/object',
			permanent: true,
		},
		{
			source: '/Guides/vector-db',
			destination: '/Services/Storage/vector',
			permanent: true,
		},
		{
			source: '/Guides/what-is-an-agent',
			destination: '/Learn/Cookbook/Tutorials/understanding-agents',
			permanent: true,
		},
		{
			source: '/Guides/:path*',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},

		// SDKs section - JavaScript
		{
			source: '/SDKs/index',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/index',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/api-reference',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/core-concepts',
			destination: '/Agents/creating-agents',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/error-handling',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/frameworks',
			destination: '/Agents/ai-sdk-integration',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/llm',
			destination: '/Agents/ai-gateway',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/troubleshooting',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/examples/index',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/examples/langchain',
			destination: '/Agents/ai-sdk-integration',
			permanent: true,
		},
		{
			source: '/SDKs/javascript/:path*',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},

		// SDKs section - Python
		{
			source: '/SDKs/python/index',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/python/api-reference',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/python/async-api',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/python/core-concepts',
			destination: '/Agents/creating-agents',
			permanent: true,
		},
		{
			source: '/SDKs/python/data-handling',
			destination: '/Agents/state-management',
			permanent: true,
		},
		{
			source: '/SDKs/python/frameworks',
			destination: '/Agents/ai-sdk-integration',
			permanent: true,
		},
		{
			source: '/SDKs/python/llm',
			destination: '/Agents/ai-gateway',
			permanent: true,
		},
		{
			source: '/SDKs/python/examples/index',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},
		{
			source: '/SDKs/python/examples/pydantic',
			destination: '/Agents/schema-libraries',
			permanent: true,
		},
		{
			source: '/SDKs/python/:path*',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/SDKs/:path*',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},

		// Troubleshooting section
		{
			source: '/Troubleshooting/error-codes/index',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/authentication',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/cli',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/datastores',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/integration',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/projects',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/error-codes/system',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},
		{
			source: '/Troubleshooting/:path*',
			destination: '/Reference/CLI/debugging',
			permanent: true,
		},

		// Examples section
		{
			source: '/Examples/index',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},
		{
			source: '/Examples/:path*',
			destination: '/Learn/Cookbook/overview',
			permanent: true,
		},

		// Changelog section - redirect to root since we don't have changelog pages
		{
			source: '/Changelog/index',
			destination: '/',
			permanent: true,
		},
		{
			source: '/Changelog/cli',
			destination: '/Reference/CLI/getting-started',
			permanent: true,
		},
		{
			source: '/Changelog/sdk-js',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/Changelog/sdk-py',
			destination: '/Reference/sdk-reference',
			permanent: true,
		},
		{
			source: '/Changelog/:path*',
			destination: '/',
			permanent: true,
		},
	],
	// API rewrites are handled by middleware.ts (to inject bearer token)
};

export default withMDX(config);

initOpenNextCloudflareForDev();
