/* eslint-disable @typescript-eslint/no-require-imports */
const matter = require("gray-matter");
const fs = require("fs").promises;
const path = require("path");

const contentDir = path.join(process.cwd(), "content");
const outputFile = path.join(contentDir, "docs.json");

async function getFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	const files = await Promise.all(
		entries.map((entry) => {
			const res = path.resolve(dir, entry.name);
			
			return entry.isDirectory() ? getFiles(res) : res;
		})
	);

	return files.flat().filter((file) => file.endsWith(".mdx"));
}

async function main() {
	const files = await getFiles(contentDir);
	const docs = [];

	for (const file of files) {
		const fileContent = await fs.readFile(file);
		const { content, data } = matter(fileContent.toString());

		docs.push({
			file: path.relative(contentDir, file),
			meta: data,
			content,
		});
	}

	await fs.writeFile(outputFile, JSON.stringify({ docs }, null, 2));

	console.log(`Wrote ${docs.length} docs to ${outputFile}`);
}

main().catch((err) => {
	console.error("Error generating docs.json:", err);

	process.exit(1);
});
