import React from 'react';
import path from 'path';
import CodeBlock from '@/app/chat/components/CodeBlock';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { readSecureFile } from '@/lib/utils/secure-path';

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

  const loaded = await Promise.all(
    snippets.map(async (s) => {
      let content = '';
      try {
        content = await readSecureFile(s.path, {
          from: s.from,
          to: s.to,
          requireLeadingSlash: true
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          label: s.title || path.basename(s.path) || s.lang || 'code',
          lang: s.lang || inferLanguageFromExtension(s.path) || 'text',
          content: `// Failed to load ${s.path}: ${message}`,
        };
      }
      return {
        label: s.title || path.basename(s.path) || s.lang || 'code',
        lang: s.lang || inferLanguageFromExtension(s.path) || 'text',
        content,
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


