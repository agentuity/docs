import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
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
		}
	],
};

export default withMDX(config);

initOpenNextCloudflareForDev();
