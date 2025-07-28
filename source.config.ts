import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			transformers: [
				...(rehypeCodeDefaultOptions.transformers ?? []),
				transformerTwoslash(),
			],
		},
	},
});

export const { docs, meta } = defineDocs({
	dir: "content/docs",
});
