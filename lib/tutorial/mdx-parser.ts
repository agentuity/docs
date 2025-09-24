import matter from 'gray-matter';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import {
  TutorialMetadataSchema,
  ParsedTutorialSchema,
  type TutorialStepData,
  type ParsedTutorial
} from './schemas';

export async function parseTutorialMDX(filePath: string): Promise<ParsedTutorial> {
  const fileContent = await readFile(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  // Validate frontmatter with Zod
  const validationResult = TutorialMetadataSchema.safeParse(frontmatter);
  if (!validationResult.success) {
    throw new Error(`Invalid tutorial frontmatter in ${filePath}: ${validationResult.error.message}`);
  }

  const metadata = validationResult.data;

  // Extract tutorial steps using regex
  const stepRegex = /<TutorialStep\s+([^>]*?)>(.*?)<\/TutorialStep>/gs;
  const steps: TutorialStepData[] = [];
  let match;

  while ((match = stepRegex.exec(content)) !== null) {
    const [fullMatch, attributes, stepContent] = match;

    // Parse attributes
    const stepNumber = parseInt(extractAttribute(attributes, 'number') || '0');
    const title = extractAttribute(attributes, 'title') || `Step ${stepNumber}`;
    const estimatedTime = extractAttribute(attributes, 'estimatedTime');

    // Extract and load CodeFromFiles snippets
    const snippets = await extractSnippets(stepContent);

    steps.push({
      stepNumber,
      title,
      estimatedTime,
      mdxContent: stepContent.trim(),
      snippets
    });
  }

  const result = {
    metadata,
    fullContent: content,
    steps: steps.sort((a, b) => a.stepNumber - b.stepNumber)
  };

  // Validate the complete parsed result
  const finalValidation = ParsedTutorialSchema.safeParse(result);
  if (!finalValidation.success) {
    throw new Error(`Invalid parsed tutorial structure for ${filePath}: ${finalValidation.error.message}`);
  }

  return finalValidation.data;
}

function extractAttribute(attributeString: string, attributeName: string): string | undefined {
  // Handle both quoted strings and JSX expressions
  const quotedRegex = new RegExp(`${attributeName}=["']([^"']*?)["']`);
  const jsxRegex = new RegExp(`${attributeName}=\\{([^}]*?)\\}`);

  let match = quotedRegex.exec(attributeString);
  if (match) return match[1];

  match = jsxRegex.exec(attributeString);
  if (match) return match[1];

  return undefined;
}

async function extractSnippets(stepContent: string): Promise<TutorialStepData['snippets']> {
  const snippets: TutorialStepData['snippets'] = [];
  const codeFromFilesRegex = /<CodeFromFiles\s+([^>]*?)\/>/g;
  let match;

  while ((match = codeFromFilesRegex.exec(stepContent)) !== null) {
    const [, attributesString] = match;
    
    // Parse snippets array from attributes
    const snippetsMatch = /snippets=\{(\[.*?\])\}/s.exec(attributesString);
    if (!snippetsMatch) continue;

    try {
      // Parse the snippets array safely without eval
      const snippetsArrayString = snippetsMatch[1];
      const parsedSnippets = parseSnippetsArray(snippetsArrayString);

      // Load content for each snippet
      for (const snippet of parsedSnippets) {
        const content = await loadSnippetContent(snippet);
        snippets.push({ ...snippet, content });
      }
    } catch (error) {
      console.warn('Failed to parse snippets:', error);
    }
  }

  return snippets;
}

function parseSnippetsArray(arrayString: string): Array<{
  path: string;
  lang?: string;
  from?: number;
  to?: number;
  title?: string;
}> {
  const snippets: Array<{
    path: string;
    lang?: string;
    from?: number;
    to?: number;
    title?: string;
  }> = [];

  // Remove outer brackets and split by object boundaries
  const cleanString = arrayString.trim().slice(1, -1); // Remove [ and ]
  
  // Split by objects - look for }, { pattern but handle nested objects
  const objectStrings: string[] = [];
  let currentObject = '';
  let braceDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < cleanString.length; i++) {
    const char = cleanString[i];
    const prevChar = i > 0 ? cleanString[i - 1] : '';

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    } else if (!inString) {
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          currentObject += char;
          objectStrings.push(currentObject.trim());
          currentObject = '';
          // Skip comma and whitespace
          while (i + 1 < cleanString.length && /[,\s]/.test(cleanString[i + 1])) {
            i++;
          }
          continue;
        }
      }
    }

    if (braceDepth > 0 || char === '{') {
      currentObject += char;
    }
  }

  // Parse each object string
  for (const objStr of objectStrings) {
    try {
      const snippet = parseSnippetObject(objStr);
      if (snippet) {
        snippets.push(snippet);
      }
    } catch (error) {
      console.warn('Failed to parse snippet object:', objStr, error);
    }
  }

  return snippets;
}

function parseSnippetObject(objectString: string): {
  path: string;
  lang?: string;
  from?: number;
  to?: number;
  title?: string;
} | null {
  const snippet: any = {};
  
  // Remove outer braces
  const content = objectString.trim().slice(1, -1);
  
  // Parse key-value pairs
  const keyValueRegex = /(\w+):\s*([^,}]+)/g;
  let match;

  while ((match = keyValueRegex.exec(content)) !== null) {
    const [, key, value] = match;
    const cleanValue = value.trim();
    
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
      // String value
      snippet[key] = cleanValue.slice(1, -1);
    } else if (cleanValue.startsWith("'") && cleanValue.endsWith("'")) {
      // String value with single quotes
      snippet[key] = cleanValue.slice(1, -1);
    } else if (/^\d+$/.test(cleanValue)) {
      // Number value
      snippet[key] = parseInt(cleanValue, 10);
    }
  }

  // Validate required path field
  if (!snippet.path || typeof snippet.path !== 'string') {
    return null;
  }

  return snippet;
}

async function loadSnippetContent(snippet: { path: string; from?: number; to?: number }): Promise<string> {
  try {
    const repoRoot = process.cwd();
    const absolutePath = path.resolve(repoRoot, `.${snippet.path}`);

    // Security check
    if (!absolutePath.startsWith(repoRoot)) {
      throw new Error('Path escapes repository root');
    }

    const fileContent = await readFile(absolutePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    const startIdx = Math.max(0, (snippet.from ? snippet.from - 1 : 0));
    const endIdx = Math.min(lines.length, snippet.to ? snippet.to : lines.length);

    return lines.slice(startIdx, endIdx).join('\n');
  } catch (error) {
    return `// Failed to load ${snippet.path}: ${error}`;
  }
}

// Cache implementation for performance
const tutorialCache = new Map<string, { parsed: ParsedTutorial; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function parseTutorialMDXCached(filePath: string): Promise<ParsedTutorial> {
  const fileStat = await stat(filePath);
  const cacheKey = `${filePath}-${fileStat.mtimeMs}`;

  const cached = tutorialCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.parsed;
  }

  const parsed = await parseTutorialMDX(filePath);
  tutorialCache.set(cacheKey, { parsed, timestamp: Date.now() });

  return parsed;
}
