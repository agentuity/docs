/**
 * Converts MDX content with JSX components to plain markdown
 * that can be rendered by ReactMarkdown in the chat interface
 */

/**
 * Strips MDX-specific JSX components and converts them to plain markdown
 */
export function convertMdxToMarkdown(mdxContent: string): string {
  let result = mdxContent;

  // Remove <TutorialStep> wrapper tags - keep the content inside
  result = result.replace(/<TutorialStep[^>]*>/g, '');
  result = result.replace(/<\/TutorialStep>/g, '');

  // Convert <Callout> to blockquote with emoji prefix
  result = result.replace(
    /<Callout\s+type="info"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, content) => `\n> ℹ️ **Info**\n${content.split('\n').map((line: string) => `> ${line}`).join('\n')}\n`
  );
  result = result.replace(
    /<Callout\s+type="warning"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, content) => `\n> ⚠️ **Warning**\n${content.split('\n').map((line: string) => `> ${line}`).join('\n')}\n`
  );
  result = result.replace(
    /<Callout\s+type="tip"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, content) => `\n> 💡 **Tip**\n${content.split('\n').map((line: string) => `> ${line}`).join('\n')}\n`
  );
  result = result.replace(
    /<Callout[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, content) => `\n> ${content.split('\n').map((line: string) => `> ${line}`).join('\n')}\n`
  );

  // Handle <CodeExample> - extract just one language version (prefer JS)
  // This regex matches CodeExample tags with backtick-delimited code spanning multiple lines
  // We match from <CodeExample to /> accounting for nested content including > characters
  result = result.replace(
    /<CodeExample\s+[\s\S]*?\/>/g,
    (full) => {
      // Try to extract js code first, fallback to py
      // Match js={`...`} where content can span multiple lines and contain any characters
      const jsMatch = full.match(/js=\{`([\s\S]*?)`\s*\}/);
      const pyMatch = full.match(/py=\{`([\s\S]*?)`\s*\}/);

      if (jsMatch) {
        const code = jsMatch[1].trim();
        return `\n\`\`\`javascript\n${code}\n\`\`\`\n`;
      } else if (pyMatch) {
        const code = pyMatch[1].trim();
        return `\n\`\`\`python\n${code}\n\`\`\`\n`;
      }
      return '';
    }
  );

  // Remove any other HTML-like tags that aren't standard markdown
  // but preserve links and basic formatting
  result = result.replace(/<div[^>]*>/g, '\n');
  result = result.replace(/<\/div>/g, '\n');
  result = result.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');

  // Clean up excessive newlines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

