import path from 'path';
import { readFile } from 'fs/promises';
import { z } from 'zod';

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathSecurityError';
  }
}

export interface SecurePathOptions {
  /**
   * Base directory to resolve paths against (defaults to process.cwd())
   */
  baseDir?: string;
  /**
   * Whether to require the path to start with '/' (repo-relative)
   */
  requireLeadingSlash?: boolean;
}

export interface ReadSecureFileOptions extends SecurePathOptions {
  /**
   * Starting line number (1-indexed, inclusive)
   */
  from?: number;
  /**
   * Ending line number (1-indexed, inclusive)
   */
  to?: number;
}

/**
 * Validates a path string for security issues without resolving it.
 * Checks for path traversal attempts and suspicious characters.
 */
export function validatePathString(pathStr: string): { valid: boolean; error?: string } {
  if (!pathStr || pathStr.trim().length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check for path traversal attempts
  if (pathStr.includes('..')) {
    return { valid: false, error: 'Path contains ".." (path traversal attempt)' };
  }

  // Check for backslashes (Windows-style paths can be problematic)
  if (pathStr.includes('\\')) {
    return { valid: false, error: 'Path contains backslashes' };
  }

  return { valid: true };
}

/**
 * Resolves a path safely within a base directory.
 * Ensures the resolved path doesn't escape the base directory.
 * 
 * @param inputPath - The path to resolve (should start with '/' for repo-relative paths)
 * @param options - Configuration options
 * @returns Absolute path that's guaranteed to be within the base directory
 * @throws {PathSecurityError} If the path is invalid or escapes the base directory
 */
export function resolveSecurePath(inputPath: string, options: SecurePathOptions = {}): string {
  const {
    baseDir = process.cwd(),
    requireLeadingSlash = true
  } = options;

  // Validate the path string
  const validation = validatePathString(inputPath);
  if (!validation.valid) {
    throw new PathSecurityError(validation.error!);
  }

  // Check if path starts with '/' if required
  if (requireLeadingSlash && !inputPath.startsWith('/')) {
    throw new PathSecurityError(
      'Path must start with "/" (repo-relative path expected)'
    );
  }

  // Resolve the path
  // If path starts with '/', treat it as repo-relative by prepending '.'
  const pathToResolve = inputPath.startsWith('/') ? `.${inputPath}` : inputPath;
  const absolutePath = path.resolve(baseDir, pathToResolve);

  // Security check: ensure the resolved path is within the base directory
  if (!absolutePath.startsWith(baseDir)) {
    throw new PathSecurityError(
      `Resolved path escapes base directory: ${path.relative(baseDir, absolutePath)}`
    );
  }

  return absolutePath;
}

/**
 * Reads a file securely with optional line range extraction.
 * Combines path resolution, security checks, and file reading.
 * 
 * @param inputPath - The path to read (should start with '/' for repo-relative paths)
 * @param options - Configuration options including line range
 * @returns File content (optionally sliced to specified line range)
 * @throws {PathSecurityError} If the path is invalid or escapes the base directory
 * @throws {Error} If the file cannot be read
 */
export async function readSecureFile(
  inputPath: string,
  options: ReadSecureFileOptions = {}
): Promise<string> {
  const { from, to, ...pathOptions } = options;

  // Resolve the path securely
  const absolutePath = resolveSecurePath(inputPath, pathOptions);

  // Read the file
  const fileContent = await readFile(absolutePath, 'utf-8');

  // If no line range specified, return full content
  if (from === undefined && to === undefined) {
    return fileContent;
  }

  // Extract line range
  const lines = fileContent.split(/\r?\n/);
  const startIdx = Math.max(0, (from ? from - 1 : 0));
  const endIdx = Math.min(lines.length, to ? to : lines.length);

  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * Zod schema for validating path strings.
 * Can be used in API route parameter validation.
 */
export const SecurePathStringSchema = z.string()
  .min(1, 'Path cannot be empty')
  .refine(
    (p) => !p.includes('..'),
    'Path contains ".." (path traversal attempt)'
  )
  .refine(
    (p) => !p.includes('\\'),
    'Path contains backslashes'
  );

/**
 * Zod schema for validating repo-relative paths (must start with '/').
 */
export const RepoRelativePathSchema = SecurePathStringSchema
  .refine(
    (p) => p.startsWith('/'),
    'Path must start with "/" (repo-relative path expected)'
  );

/**
 * Zod schema for validating simple path identifiers (no slashes, no dots).
 * Useful for validating tutorial IDs, page paths, etc.
 */
export const PathIdentifierSchema = z.string()
  .min(1, 'Identifier cannot be empty')
  .refine(
    (id) => !id.includes('..') && !id.includes('/') && !id.includes('\\'),
    'Identifier contains invalid characters (path traversal attempt)'
  );

