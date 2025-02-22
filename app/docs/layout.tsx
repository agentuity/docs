import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
// import { RootToggle } from "fumadocs-ui/components/layout/root-toggle";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.pageTree}
			{...baseOptions}
			// sidebar={{
			// 	banner: (
			// 		<RootToggle
			// 			options={[
			// 				{
			// 					title: "Documentation",
			// 					description: "Agentuity Cloud",
			// 					url: "/docs/",
			// 				},
			// 				{
			// 					title: "SDKs",
			// 					description: "Agentuity SDKs",
			// 					url: "/docs/SDKs",
			// 				},
			// 				// {
			// 				// 	title: "API",
			// 				// 	description: "Agentuity API",
			// 				// 	url: "/docs/api",
			// 				// },
			// 			]}
			// 		/>
			// 	),
			// }}
		>
			{children}
		</DocsLayout>
	);
}
