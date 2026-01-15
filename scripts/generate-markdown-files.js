/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');

const contentDir = path.join(process.cwd(), 'content');
const docsJsonFile = path.join(contentDir, 'docs.json');
const publicDir = path.join(process.cwd(), 'public');

async function main() {
	const docsJson = JSON.parse(await fs.readFile(docsJsonFile, 'utf-8'));
	const docs = docsJson.docs;

	let count = 0;

	for (const doc of docs) {
		const title = doc.meta.title || '';
		const description = doc.meta.description || '';
		const markdown = `# ${title}\n\n${description ? `${description}\n\n` : ''}${doc.content}`;

		const mdPath = doc.file.replace(/\.mdx$/, '.md').replace(/\/index\.md$/, '.md');
		const outputPath = path.join(publicDir, mdPath);

		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		await fs.writeFile(outputPath, markdown);
		count++;
	}

	console.log(`Generated ${count} markdown files in public/`);
}

main().catch((err) => {
	console.error('Error generating markdown files:', err);
	process.exit(1);
});
