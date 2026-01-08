import docsJson from '@/content/docs.json';

interface Doc {
	file: string;
	meta: Record<string, unknown>;
	content: string;
}

const docs = docsJson.docs as Doc[];

export const revalidate = false;

export async function GET() {
	try {
		const preamble = `# Agentuity Documentation

## About

This is the official documentation for Agentuity, a cloud platform designed specifically for building, deploying, and scaling autonomous AI agents.

## Capabilities

The documentation covers:
- General cloud and account information
- CLI usage and commands
- SDK integration
- Examples, tutorials, and sample implementations
- Troubleshooting and best practices

## Limitations

- The documentation primarily focuses on Agentuity services and may not cover all aspects of AI agent development
- Some advanced features may require additional knowledge of AI frameworks
- Examples are provided for common use cases but may need adaptation for specific requirements

## Documentation Pages

`;

		const scanned = docs.map((doc) => {
			if (!doc.file.startsWith('Changelog')) {
				// return `file: ${doc.file}\nmeta: ${JSON.stringify(doc.meta, null, 2)}\n${doc.content}`;
				return `-----\n### ${doc.meta.title}\nhttps://agentuity.dev/${doc.file.replace('.mdx', '.md')}\n-----\n${doc.content}`;
			}
		});

		return new Response(preamble + scanned.join('\n\n'), {
			headers: { 'Content-Type': 'text/plain' },
		});
	} catch (error) {
		console.error('Error in GET route:', error);

		return new Response(
			JSON.stringify({
				error: 'Failed to process content',
				details: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
