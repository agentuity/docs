import React from "react";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { createStyleTransformer } from "fumadocs-core/server";
// import { transformerTwoslash } from "fumadocs-twoslash";
// import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { getSingletonHighlighter, bundledLanguages } from "shiki";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

export async function Code({
	code,
	lang = "ts",
}: {
	lang?: string;
	code: string;
}) {
	const highlighter = await getSingletonHighlighter({
		langs: Object.keys(bundledLanguages),
		themes: ["vesper"],
	});

	const hast = highlighter.codeToHast(code, {
		lang,
		themes: {
			light: "vesper",
			dark: "vesper",
		},
		defaultColor: false,
		transformers: [
			createStyleTransformer(),
		],
	});

	const rendered = toJsxRuntime(hast, {
		Fragment,
		jsx,
		jsxs,
		development: false,
		components: {
			pre: (props) => (
				<CodeBlock {...props}>
					<Pre>{props.children}</Pre>
				</CodeBlock>
			),
		},
	});

	return rendered;
}
