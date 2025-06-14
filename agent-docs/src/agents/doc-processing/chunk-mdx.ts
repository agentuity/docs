import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";

export function detectContentType(textChunk: string): string {
  if (/^---\n.*?---/s.test(textChunk.trim())) {
    return "frontmatter";
  }
  // Code blocks
  if (/```[\w]*\n.*?```/s.test(textChunk)) {
    return "code_block";
  }
  // Headers with substantial content
  if (/^#{1,6}\s+/.test(textChunk.trim()) && textChunk.length > 100) {
    return "header_section";
  }
  // Just headers (short)
  if (/^#{1,6}\s+/.test(textChunk.trim())) {
    return "header";
  }
  // Tables (markdown tables)
  if (/\|.*\|.*\|/.test(textChunk) && (textChunk.match(/\|/g) || []).length >= 4) {
    return "table";
  }
  // Lists (multiple list items)
  const lines = textChunk.split("\n");
  const listLines = lines.filter(line => /^[-*+]\s+|^\d+\.\s+/.test(line.trim()));
  if (listLines.length >= 2) {
    return "list";
  }
  return "text";
}

export function createContentAwareSplitter(contentType: string) {
  if (contentType === "frontmatter") {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 0,
      separators: ["\n---\n"],
    });
  } else if (contentType === "code_block") {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
      separators: ["\n```\n", "\n\n", "\n"],
    });
  } else if (contentType === "header_section") {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 1200,
      chunkOverlap: 150,
      separators: ["\n## ", "\n### ", "\n#### ", "\n\n", "\n"],
    });
  } else if (contentType === "table") {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 0,
      separators: ["\n\n"],
    });
  } else if (contentType === "list") {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
      separators: ["\n\n", "\n- ", "\n* ", "\n+ "],
    });
  } else {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", " "],
    });
  }
}

export async function hybridChunkDocument(doc: any) {
  const initialSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 100,
    separators: ["\n## ", "\n### ", "\n\n", "\n"],
  });
  const initialChunks = await initialSplitter.splitDocuments([doc]);
  const finalChunks: any[] = [];
  for (const chunk of initialChunks) {
    const contentType = detectContentType(chunk.pageContent);
    const contentSplitter = createContentAwareSplitter(contentType);
    const refinedChunks = await contentSplitter.splitDocuments([chunk]);
    for (const refinedChunk of refinedChunks) {
      refinedChunk.metadata = refinedChunk.metadata || {};
      refinedChunk.metadata.contentType = contentType;
    }
    finalChunks.push(...refinedChunks);
  }
  return finalChunks;
}

export async function generateDocsChunks(docsPath: string) {
  const loader = new DirectoryLoader(
    docsPath,
    { ".mdx": (filePath: string) => new TextLoader(filePath) }
  );
  const docs = await loader.load();
  const allChunks: any[] = [];
  for (const doc of docs) {
    const docChunks = await hybridChunkDocument(doc);
    allChunks.push(...docChunks);
  }
  return allChunks;
} 