import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, readdir, stat } from 'fs/promises';
import matter from 'gray-matter';

export async function GET(request: NextRequest) {
  try {
    const repoRoot = process.cwd();
    const tutorialRoot = join(repoRoot, 'content', 'Tutorial');

    // Use parent meta.json to control order and which tutorials show up
    const parentMetaPath = join(tutorialRoot, 'meta.json');
    const parentMetaRaw = await readFile(parentMetaPath, 'utf-8');
    const parentMeta = JSON.parse(parentMetaRaw) as { title?: string; pages?: string[] };
    const pages = (parentMeta.pages ?? []).filter(Boolean);

    const results: Array<{ id: string; title: string; description?: string; totalSteps: number }> = [];

    for (const entry of pages) {
      if (entry.includes('..') || entry.includes('/') || entry.includes('\\')) {
        continue;
      }
      
      const dirPath = join(tutorialRoot, entry);
      const filePath = join(tutorialRoot, `${entry}.mdx`);
      try {
        const st = await stat(dirPath).catch(() => null);
        if (st && st.isDirectory()) {
          // Directory tutorial: read its meta.json and index.mdx (if present)
          const childMetaRaw = await readFile(join(dirPath, 'meta.json'), 'utf-8');
          const childMeta = JSON.parse(childMetaRaw) as { title?: string; pages?: string[] };

          const pagesList = childMeta.pages ?? [];
          const totalSteps = pagesList.filter(p => p !== 'index').length || 0;

          let description: string | undefined;
          try {
            const idxPath = join(dirPath, 'index.mdx');
            const idxRaw = await readFile(idxPath, 'utf-8');
            const idx = matter(idxRaw);
            if (typeof idx.data?.description === 'string') description = idx.data.description;
          } catch {
            // ignore if index missing
          }

          results.push({
            id: entry,
            title: childMeta.title || entry,
            description,
            totalSteps
          });
        } else {
          // Single-file tutorial
          const mdxRaw = await readFile(filePath, 'utf-8');
          const fm = matter(mdxRaw);
          const title = (fm.data?.title as string) || entry;
          const description = typeof fm.data?.description === 'string' ? (fm.data.description as string) : undefined;
          results.push({ id: entry, title, description, totalSteps: 1 });
        }
      } catch (err) {
        // Skip malformed entries but continue
        // eslint-disable-next-line no-console
        console.warn(`Skipping tutorial entry ${entry}:`, err);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error reading tutorials:', error);

    // Return proper HTTP error status with minimal error info
    return NextResponse.json(
      { error: 'Failed to read tutorials' },
      { status: 500 }
    );
  }
}  