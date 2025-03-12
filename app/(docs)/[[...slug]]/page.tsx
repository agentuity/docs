import { source } from "@/lib/source";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { Code } from "../../../components/Code";

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);

	if (!page) notFound();

	const MDX = page.data.body;

	return (
		<DocsPage
			toc={page.data.toc}
			full={page.data.full}
			editOnGithub={{
				owner: "agentuity",
				repo: "docs",
				sha: "main",
				path: `content/${page.file.path}`,
			}}
		>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={{
						...defaultMdxComponents,
						h2: (props) => {
							const { children } = props;
							// Check if heading contains an error code (format: XXX-000)
							const text = String(children);
							const match = text.match(/^([A-Z]+-\d+):/);
							
							if (match) {
								// Extract the error code and use it as the anchor ID
								const errorCode = match[1];
								return (
									<h2 id={errorCode} {...props}>
										{children}
									</h2>
								);
							}
							// Default behavior for non-error-code headings
							return defaultMdxComponents.h2(props);
						},
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
		title:
			page.data.title && page.data.title !== "Agentuity"
				? `${page.data.title} — Agentuity Docs`
				: "Agentuity Docs",
		description: page.data.description,
	};
}
