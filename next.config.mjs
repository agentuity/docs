import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: ["twoslash", "typescript"],
	redirects: async () => [
		{
			source: "/",
			destination: "/Introduction",
			permanent: true,
		},
		{
			source: "/docs",
			destination: "/",
			permanent: true,
		},
		// Error code redirects
		{
			source: "/errors/:code(CLI-\\d+)",
			destination: "/Troubleshooting/error-codes/cli#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(AUTH-\\d+)",
			destination: "/Troubleshooting/error-codes/authentication#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(PROJ-\\d+)",
			destination: "/Troubleshooting/error-codes/projects#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(AGENT-\\d+)",
			destination: "/Troubleshooting/error-codes/agents#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(DATA-\\d+)",
			destination: "/Troubleshooting/error-codes/datastores#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(INT-\\d+)",
			destination: "/Troubleshooting/error-codes/integrations#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
		{
			source: "/errors/:code(SYS-\\d+)",
			destination: "/Troubleshooting/error-codes/system#:code*",
			permanent: true,
			transform: {
				code: (code) => code.toLowerCase(),
			},
		},
	],
};

export default withMDX(config);

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
