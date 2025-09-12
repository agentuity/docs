import React from 'react';
import { readFile } from 'fs/promises';
import path from 'path';
import CodeBlock from '@/app/chat/components/CodeBlock';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';

export interface CodeFromFilesSnippet {
  path: string; // repo-root-relative, e.g. "/examples/poc-tutorial/src/agent.ts"
  lang?: string; // e.g. "ts", "py"
  from?: number; // 1-based
  to?: number;   // inclusive
  title?: string; // tab label; defaults to basename or lang
}

interface CodeFromFilesProps {
  snippets: CodeFromFilesSnippet[];
  title?: string;
}

function inferLanguageFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts': return 'ts';
    case '.tsx': return 'tsx';
    case '.js': return 'js';
    case '.jsx': return 'jsx';
    case '.json': return 'json';
    case '.py': return 'python';
    case '.sh':
    case '.bash': return 'bash';
    case '.yml':
    case '.yaml': return 'yaml';
    default: return '';
  }
}

export default async function CodeFromFiles(props: CodeFromFilesProps) {
  const { title, snippets } = props;

  if (!Array.isArray(snippets) || snippets.length === 0) {
    return null;
  }

  const repoRoot = process.cwd();

  const loaded = await Promise.all(
    snippets.map(async (s) => {
      if (!s.path.startsWith('/')) {
        throw new Error('CodeFromFiles: each snippet.path must start with "/" (repo-root-relative)');
      }
      const absolutePath = path.resolve(repoRoot, `.${s.path}`);
      if (!absolutePath.startsWith(repoRoot)) {
        throw new Error('CodeFromFiles: resolved path escapes repository root');
      }
      let fileContent = '';
      try {
        fileContent = await readFile(absolutePath, 'utf-8');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          label: s.title || path.basename(s.path) || s.lang || 'code',
          lang: s.lang || inferLanguageFromExtension(s.path) || 'text',
          content: `// Failed to load ${s.path}: ${message}`,
        };
      }
      const lines = fileContent.split(/\r?\n/);
      const startIdx = Math.max(0, (s.from ? s.from - 1 : 0));
      const endIdx = Math.min(lines.length, s.to ? s.to : lines.length);
      const sliced = lines.slice(startIdx, endIdx).join('\n');
      return {
        label: s.title || path.basename(s.path) || s.lang || 'code',
        lang: s.lang || inferLanguageFromExtension(s.path) || 'text',
        content: sliced,
      };
    })
  );

  return (
    <div className="not-prose">
      {title ? <div className="mb-2 text-sm text-fd-muted-foreground">{title}</div> : null}
      <Tabs items={loaded.map((x) => x.label)}>
        {loaded.map((x, idx) => (
          <Tab key={idx} value={x.label}>
            <CodeBlock content={x.content} language={x.lang} />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}


