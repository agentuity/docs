import { CLICommand } from '@/components/CLICommand';
import { CodeExample } from '@/components/CodeExample';
import { Mermaid } from '@/components/Mermaid';
import { Sparkle } from '@/components/Sparkle';
import { ThemeImage } from '@/components/ThemeImage';
import { TypingAnimation } from '@/components/TypingAnimation';
import { XButton } from '@/components/XButton';
import { source } from '@/lib/source';
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { CommunityButton } from '../../../components/Community';
import { NavButton } from '../../../components/NavButton';
import CopyPageDropdown from '../../../components/CopyPageDropdown';

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
				owner: 'agentuity',
				repo: 'docs',
				sha: 'main',
				path: `content/${page.file.path}`,
			}}
		>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
				<DocsTitle className="mb-0">{page.data.title}</DocsTitle>
				<div className="hidden sm:flex justify-end">
					<CopyPageDropdown enhanced={true} />
				</div>
			</div>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={{
						...defaultMdxComponents,
						Popup,
						PopupContent,
						PopupTrigger,
						CodeExample,
						CLICommand,
						CommunityButton,
						Mermaid,
						NavButton,
						Sparkle,
						Tab,
						Tabs,
						ThemeImage,
						TypingAnimation,
					}}
				/>
				<div className="mt-12 border p-4 rounded-lg bg-fd-card">
					<h3 className="mt-1 text-fd-foreground">Need Help?</h3>
					<p>
						Join our <CommunityButton noBorder /> for assistance or just to hang
						with other humans building agents.
					</p>
					<p>
						Send us an email at{' '}
						<a href="mailto:hi@agentuity.com">hi@agentuity.com</a> if you&apos;d
						like to get in touch.
					</p>
					<p className="flex items-center gap-2">
						Please <XButton follow noBorder />
					</p>
					<p>
						If you haven&apos;t already, please{' '}
						<a href="https://app.agentuity.com/sign-up">Signup</a> for your free
						account now and start building your first agent!
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
			page.data.title && page.data.title !== 'Agentuity'
				? `${page.data.title} — Agentuity Docs`
				: 'Agentuity Docs',
		description: page.data.description,
	};
}
