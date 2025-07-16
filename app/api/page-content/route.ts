import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return new Response('Path parameter required', { status: 400 });
    }
    
    let filePath;
    const basePath = join(process.cwd(), 'content');
    
    const indexPath = join(basePath, path, 'index.mdx');
    const directPath = join(basePath, `${path}.mdx`);
    
    try {
      await readFile(indexPath, 'utf-8');
      filePath = indexPath;
    } catch {
      filePath = directPath;
    }
    
    const fileContent = await readFile(filePath, 'utf-8');
    const { content, data } = matter(fileContent);
    
    return Response.json({
      content,
      title: data.title || '',
      description: data.description || '',
      path
    });
  } catch (error) {
    console.error('Error reading page content:', error);
    return new Response('Failed to read page content', { status: 500 });
  }
}
