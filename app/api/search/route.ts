import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { NextRequest } from 'next/server';

// Create the default search handler
const { GET: defaultSearchHandler } = createFromSource(source);

// Helper function to convert document path to URL
function documentPathToUrl(docPath: string): string {
  // Remove .mdx extension and convert to URL format
  // "CLI/agent.mdx" -> "/CLI/agent"
  return '/' + docPath.replace(/\.mdx?$/, '');
}

// Helper function to get document title from source
function getDocumentTitle(docPath: string): string {
  try {
    // Convert path to URL format for source lookup
    const urlPath = documentPathToUrl(docPath).substring(1).split('/'); // Remove leading slash and split
    const page = source.getPage(urlPath);
    return page?.data.title || docPath.replace(/\.mdx?$/, '').replace(/\//g, ' > ');
  } catch {
    // Fallback to formatted path if lookup fails
    return docPath.replace(/\.mdx?$/, '').replace(/\//g, ' > ');
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log(request.url);
  const query = searchParams.get('query');
  console.log("query: " + query);
  
  // If no query, return empty results
  if (!query || query.trim().length === 0) {
    return Response.json([]);
  }

  try {
    // Call your AI agent API
    const response = await fetch('https://agentuity.ai/api/9ccc5545e93644bd9d7954e632a55a61', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wht_843942568308430586ec1bc460245a8f',
      },
      body: JSON.stringify({ message: query }),
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.status}`);
    }

    const data = await response.json();

    const results = [];

    // 1. Add the AI answer as the first result (most prominent)
    if (data.answer) {
      results.push({
        id: `ai-answer-${Date.now()}`,
        url: '#ai-answer', // Special marker for AI answers
        title: `🤖 AI Answer`,
        content: data.answer,
        type: 'ai-answer' // Custom type for styling
      });
    }

    // 2. Add related documents as clickable results
    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach((docPath: string, index: number) => {
        const url = documentPathToUrl(docPath);
        const title = getDocumentTitle(docPath);
        
        results.push({
          id: `doc-${Date.now()}-${index}`,
          url: url,
          title: `📄 ${title}`,
          content: `Related documentation: ${title}`,
          type: 'document' // Custom type for styling
        });
      });
    }

    return Response.json(results);

  } catch (error) {
    console.error('Error calling AI agent:', error);
    
    // Fallback to original Fumadocs search behavior if AI fails
    return defaultSearchHandler(request);
  }
}
