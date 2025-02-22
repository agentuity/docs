import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		// can be JSX too!
		title: "Agentuity",
	},
	links: [
		{
			text: "Documentation",
			url: "/docs",
			active: "nested-url",
		},
		// {
		// 	type: "menu",
		// 	text: "SDKs",
		// 	items: [
		// 		{
		// 			text: "Python",
		// 			description: "The Python SDK for Agentuity",
		// 			url: "/docs/sdks/python",
		// 			// (optional) Props for Radix UI Navigation Menu item in Home Layout
		// 			menu: {
		// 				className: "row-span-2",
		// 				// add banner to navigation menu card
		// 				// can be an image or other elements
		// 				banner: <div>Python based SDKs</div>,
		// 			},
		// 		},
		// 		{
		// 			text: "JavaScript",
		// 			description: "The JavaScript SDK for Agentuity",
		// 			url: "/docs/sdks/javascript",
		// 			menu: {
		// 				className: "row-span-2",
		// 				banner: <div>JavaScript based SDKs</div>,
		// 			},
		// 		},
		// 	],
		// },
		// {
		// 	text: "API",
		// 	url: "/docs/api",
		// 	active: "nested-url",
		// },
	],
};
