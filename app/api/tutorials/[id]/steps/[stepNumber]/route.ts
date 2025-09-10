import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import matter from 'gray-matter';

interface RouteParams {
  params: Promise<{ id: string; stepNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, stepNumber } = await params;
    const stepIndex = parseInt(stepNumber, 10);
    if (Number.isNaN(stepIndex) || stepIndex < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid step number' },
        { status: 400 }
      );
    }

    const repoRoot = process.cwd();
    const tutorialDir = join(repoRoot, 'content', 'Tutorial', id);

    // Load child tutorial meta.json to get ordered pages
    const childMetaRaw = await readFile(join(tutorialDir, 'meta.json'), 'utf-8');
    const childMeta = JSON.parse(childMetaRaw) as { title?: string; pages?: string[] };
    const pages = (childMeta.pages ?? []).filter(Boolean);

    // Filter out index; map to actual MDX files
    const stepSlugs = pages.filter(p => p !== 'index');
    const slug = stepSlugs[stepIndex - 1];
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }

    const mdxPath = join(tutorialDir, `${slug}.mdx`);
    const mdxRaw = await readFile(mdxPath, 'utf-8');
    const parsed = matter(mdxRaw);

    // Extract CodeFromFiles tags and resolve their snippet arrays
    const snippets: Array<{ path: string; lang?: string; from?: number; to?: number; title?: string; content: string }> = [];

    // Helper to load a snippet descriptor into content
    async function loadSnippet(desc: { path: string; lang?: string; from?: number; to?: number; title?: string }) {
      const filePath = desc.path;
      if (!filePath || !filePath.startsWith('/examples/')) return;
      const absolutePath = join(repoRoot, `.${filePath}`);
      const fileRaw = await readFile(absolutePath, 'utf-8');
      const lines = fileRaw.split(/\r?\n/);
      const startIdx = Math.max(0, (desc.from ? desc.from - 1 : 0));
      const endIdx = Math.min(lines.length, desc.to ? desc.to : lines.length);
      const content = lines.slice(startIdx, endIdx).join('\n');
      snippets.push({ ...desc, content });
    }

    // 1) Parse <CodeFromFiles snippets={[{...}, {...}]}/> blocks
    // Robust parser that balances braces to extract snippets={[ ... ]}
    const filesTagRegex = /<CodeFromFiles\s+([^>]*?)\/>/g;
    let filesTagMatch: RegExpExecArray | null;
    while ((filesTagMatch = filesTagRegex.exec(parsed.content)) !== null) {
      const propsSrc: string = filesTagMatch[1] || '';

      const key = 'snippets={';
      const start = propsSrc.indexOf(key);
      if (start < 0) continue;
      let i = start + key.length; // position after '{'
      let depth = 1;
      // Scan until matching closing '}' for the snippets prop
      while (i < propsSrc.length && depth > 0) {
        const ch = propsSrc[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      // slice without outer braces
      const inner = propsSrc.slice(start + key.length, i - 1).trim(); // should be array source like "[{...},{...}]"

      // Extract object literals from the array by balancing braces again
      const objects: string[] = [];
      let j = 0;
      while (j < inner.length) {
        if (inner[j] === '{') {
          let d = 1;
          let k = j + 1;
          while (k < inner.length && d > 0) {
            const ch = inner[k];
            if (ch === '{') d++;
            else if (ch === '}') d--;
            k++;
          }
          objects.push(inner.slice(j, k));
          j = k;
        } else {
          j++;
        }
      }

      for (const objSrc of objects) {
        const getStr = (name: string): string | undefined => {
          const r = new RegExp(name + '\\s*:\\s*"([^"]*)"');
          const mm = r.exec(objSrc);
          return mm ? mm[1] : undefined;
        };
        const getNum = (name: string): number | undefined => {
          const r = new RegExp(name + '\\s*:\\s*(\\d+)');
          const mm = r.exec(objSrc);
          return mm ? Number(mm[1]) : undefined;
        };
        const desc = {
          path: getStr('path') || '',
          lang: getStr('lang'),
          from: getNum('from'),
          to: getNum('to'),
          title: getStr('title')
        };
        if (desc.path) {
          await loadSnippet(desc);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tutorialId: id,
        stepNumber: stepIndex,
        slug,
        meta: parsed.data ?? {},
        mdx: parsed.content,
        snippets,
        totalSteps: pages.length
      }
    });
  } catch (error) {
    console.error('Error reading tutorial step:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read tutorial step',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 