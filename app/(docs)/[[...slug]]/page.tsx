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
import { CommunityButton } from "../../../components/Community";
import { NavButton } from "../../../components/NavButton";
import { XButton } from "@/components/XButton";
import { ThemeImage } from "@/components/ThemeImage";
import { Sparkle } from "@/components/Sparkle";

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
						Popup,
						PopupContent,
						PopupTrigger,
						Code,
						CommunityButton,
						NavButton,
						Sparkle,
						Tab,
						Tabs,
						ThemeImage,
					}}
				/>
				<div className="mt-12 border p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
					<h3 className="mt-1 text-cyan-800 dark:text-cyan-700">Need Help?</h3>
					<p>
						Join our <CommunityButton noBorder /> for assistance or just to hang
						with other humans building agents.
					</p>
					<p>
						You can also send us an email at{" "}
						<a href="mailto:hi@agentuity.com">hi@agentuity.com</a> if you&apos;d
						like to get in touch.
					</p>
					<p className="flex items-center gap-2">
						You can also <XButton follow noBorder />
					</p>
				</div>
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
