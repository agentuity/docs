import type { NextRequest } from 'next/server';
import { queryAgentQa } from '@/lib/api/services';
import { source } from '@/lib/source';

function documentPathToUrl(docPath: string): string {
	// Remove the .md or .mdx extension before any # symbol
	const path = docPath.replace(/\.mdx?(?=#|$)/, '');

	// Split path and hash (if any)
	const [basePath, hash] = path.split('#');

	// Split the base path into segments
	const segments = basePath.split('/').filter(Boolean);

	// If the last segment is 'index', remove it
	if (
		segments.length > 0 &&
		segments[segments.length - 1].toLowerCase() === 'index'
	) {
		segments.pop();
	}

	// Reconstruct the path
	let url = '/' + segments.join('/');
	if (url === '/') {
		url = '/';
	}
	if (hash) {
		url += '#' + hash;
	}
	return url;
}

// Helper function to get document title and description from source
function getDocumentMetadata(docPath: string): {
	title: string;
	description?: string;
} {
	try {
		const urlPath = documentPathToUrl(docPath).substring(1).split('/');
		const page = source.getPage(urlPath);

		if (page?.data) {
			return {
				title: page.data.title || formatPathAsTitle(docPath),
				description: page.data.description,
			};
		}
	} catch (error) {
		console.warn(`Failed to get metadata for ${docPath}:`, error);
	}

	return { title: formatPathAsTitle(docPath) };
}

function formatPathAsTitle(docPath: string): string {
	return docPath
		.replace(/\.mdx?$/, '')
		.split('/')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' > ');
}

function getDocumentSnippet(docPath: string, maxLength = 150): string {
	try {
		const urlPath = documentPathToUrl(docPath).substring(1).split('/');
		const page = source.getPage(urlPath);

		if (page?.data.description) {
			return page.data.description.length > maxLength
				? page.data.description.substring(0, maxLength) + '...'
				: page.data.description;
		}

		// Fallback description based on path
		const pathParts = docPath.replace(/\.mdx?$/, '').split('/');
		const section = pathParts[0];
		const topic = pathParts[pathParts.length - 1];

		return `Learn about ${topic} in the ${section} section of our documentation.`;
	} catch {
		return `Documentation for ${formatPathAsTitle(docPath)}`;
	}
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get('query');

	// If no query, return empty results
	if (!query || query.trim().length === 0) {
		return Response.json([]);
	}

	try {
		const data = await queryAgentQa(query);
		const results = [];

		if (data?.answer?.trim()) {
			results.push({
				id: `ai-answer-${Date.now()}`,
				url: '#ai-answer',
				title: 'AI Answer',
				content: data.answer.trim(),
				type: 'ai-answer',
			});
		}

		// Add related documents as clickable results
		if (
			data.documents &&
			Array.isArray(data.documents) &&
			data.documents.length > 0
		) {
			// Deduplicate by URL
			const seenUrls = new Set<string>();
			const uniqueDocuments = data.documents.filter((doc) => {
				if (seenUrls.has(doc.url)) return false;
				seenUrls.add(doc.url);
				return true;
			});

			uniqueDocuments.forEach((doc, index: number) => {
				try {
					const url = documentPathToUrl(doc.url);

					const title = doc.title || getDocumentMetadata(doc.url).title;
					const snippet = getDocumentSnippet(doc.url);

					results.push({
						id: `doc-${Date.now()}-${index}`,
						url: url,
						title: title,
						content: snippet,
						type: 'document',
					});
				} catch (error) {
					console.warn(`Failed to process document ${doc.url}:`, error);
				}
			});
		}

		console.log('Returning RAG results:', results.length, 'items');
		return Response.json(results);
	} catch (error) {
		console.error('Error calling AI agent:', error);

		// Return error message as AI answer
		return Response.json([
			{
				id: 'error-notice',
				url: '#error',
				title: '❌ Search Error',
				content:
					'AI search is temporarily unavailable. Please try again later or use the regular search.',
				type: 'ai-answer',
			},
		]);
	}
}
