import { NextRequest } from 'next/server';
import docsJson from '@/content/docs.json';

interface Doc {
  file: string;
  meta: Record<string, unknown>;
  content: string;
}

const docs = docsJson.docs as Doc[];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return new Response('Path parameter required', { status: 400 });
    }
    
    if (path.includes('..') || path.includes('\\') || path.startsWith('/')) {
      return new Response('Invalid path parameter', { status: 400 });
    }
    
    const doc = docs.find(d => 
      d.file === `${path}.mdx` ||
      d.file === `${path}/index.mdx` ||
      d.file === path
    );
    
    if (!doc) {
      return new Response('Page not found', { status: 404 });
    }
    
    return Response.json({
      content: doc.content,
      title: doc.meta.title || '',
      description: doc.meta.description || '',
      path
    });
  } catch (error) {
    console.error('Error reading page content:', error);
    return new Response('Failed to read page content', { status: 500 });
  }
}
