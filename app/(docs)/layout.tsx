import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import AISearchToggle from "../../components/AISearchToggle";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			{...baseOptions}
			tree={source.pageTree}
			searchToggle={{
				components: {
					lg: (
						<div className="flex gap-1.5 max-md:hidden">
							<LargeSearchToggle className="flex-1" />
							<AISearchToggle />
						</div>
					),
				},
			}}
		>
			{children}
		</DocsLayout>
	);
}
