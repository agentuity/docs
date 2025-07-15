import { source } from "@/lib/source";
import {
	DocsPage,
	DocsBody,
	DocsDescription,
	DocsTitle,
} from "fumadocs-ui/page";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Code } from "../../../components/Code";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";

function filterMethodsFromToc(toc: any[]): any[] {
	if (!toc) return toc;
	
	const filtered = toc.filter(item => {
		const methodPatterns = [
			/\w+\s*\([^)]*\)/, // function signatures with parentheses
			/^[a-z][a-zA-Z0-9]*\s*\(/, // starts with lowercase + parentheses
			/\w+\.\w+\s*\(/, // dot notation with parentheses
		];
		
		const titleText = item.title?.props?.children || item.value || '';
		const isMethod = methodPatterns.some(pattern => pattern.test(titleText));
		return !isMethod;
	}).map(item => ({
		...item,
		children: item.children ? filterMethodsFromToc(item.children) : item.children
	}));
	
	return filtered;
}

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;
	
	const filteredToc = filterMethodsFromToc(page.data.toc);

	return (
		<DocsPage toc={filteredToc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={{
						...defaultMdxComponents,
						Popup,
						PopupContent,
						PopupTrigger,
						Code,
						Tab,
						Tabs,
					}}
				/>
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	return {
		title: page.data.title,
		description: page.data.description,
	};
}
