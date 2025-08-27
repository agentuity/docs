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
This is the official documentation for Agentuity, a cloud platform designed specifically for building, deploying, and scaling autonomous AI agents. It provides the infrastructure and tools necessary to manage agents built with any framework, such as CrewAI, LangChain, or custom code.

## Capabilities
The documentation covers:
- General cloud and account information
- CLI usage and commands
- SDK integration (Python, JavaScript, etc.)
- Examples, tutorials, and sample implementations
- Troubleshooting and best practices

## Limitations
- The documentation primarily focuses on Agentuity services and may not cover all aspects of AI agent development
- Some advanced features may require additional knowledge of AI frameworks
- Examples are provided for common use cases but may need adaptation for specific requirements

## Preferred Interaction
When interacting with this documentation:
- Start with the Introduction section for an overview of Agentuity
- Refer to specific sections (Cloud, CLI, SDKs, Examples) based on your needs
- Follow the step-by-step tutorials for practical implementation
- Check the Troubleshooting section for common issues and solutions

## Main Sections
1. Introduction - Overview of the Agentuity cloud and its features
2. Cloud - Platform features, account management, and deployment options
3. CLI (Command Line Interface) - Installation, authentication, project management, environment variables, and other CLI commands
4. SDKs & Integration - SDKs for various languages and frameworks (CrewAI, LangChain, Python, Node.js)
5. Examples & Tutorials - Sample projects, step-by-step tutorials, and implementation guides
6. Troubleshooting - Common issues and solutions\n\n`;

		const scanned = docs.map((doc) => {
			if (!doc.file.startsWith('Changelog')) {
				return `file: ${doc.file}\nmeta: ${JSON.stringify(doc.meta, null, 2)}\n${doc.content}`;
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
