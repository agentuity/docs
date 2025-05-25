import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { CommunityButton } from "../components/Community";
import { NavButton } from "../components/NavButton";
import { XButton } from "../components/XButton";

/**
 * Shared layout configurations
 */
export const baseOptions: BaseLayoutProps = {
	githubUrl: "https://github.com/agentuity",
	nav: {
		url: "/Introduction",
		title: (
			<div className="flex items-center gap-3 font-medium">
				<svg
					role="img"
					aria-label="Agentuity"
					className="fill-cyan-700 dark:fill-cyan-500"
					width="24"
					height="22"
					viewBox="0 0 24 22"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Agentuity</title>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M24 21.3349H0L3.4284 15.3894H0L0.872727 13.8622H19.6909L24 21.3349ZM5.19141 15.3894L2.6437 19.8076H21.3563L18.8086 15.3894H5.19141Z"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 0.498535L17.1762 9.49853H20.6182L21.4909 11.0258H5.94545L12 0.498535ZM8.58569 9.49853L12 3.56193L15.4143 9.49853H8.58569Z"
					/>
				</svg>
				Agentuity
			</div>
		),
	},
	links: [
		{
			type: "custom",
			on: "nav",
			children: (
				<div className="flex gap-3">
					<div className="flex items-center justify-start gap-3">
						<NavButton href="https://agentuity.com/blog">Blog</NavButton>
						<NavButton href="https://app.agentuity.com">Console</NavButton>
					</div>
					<div className="flex items-center justify-end gap-3">
						<CommunityButton />
						<XButton />
					</div>
				</div>
			),
		},
	],
};
