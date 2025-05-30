import { cn } from "fumadocs-ui/utils/cn";

export interface NavButtonProps {
	href: string;
	children: React.ReactNode;
	noBorder?: boolean;
	className?: string;
}
export function NavButton({
	href,
	children,
	className,
	noBorder = false,
}: NavButtonProps) {
	return (
		<a
			href={href}
			className={cn(
				"inline-flex flex-row items-center gap-2 w-auto no-underline",
				noBorder
					? "border-none"
					: "hover:border-cyan-700 hover:dark:border-cyan-900 border rounded-full border-gray-200 dark:border-gray-800 px-2.5 h-9",
				className,
			)}
		>
			{children}
		</a>
	);
}
