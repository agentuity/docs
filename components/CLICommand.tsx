import { CodeBlock } from "fumadocs-ui/components/codeblock";

export interface CLICommandProps {
	command: string;
	children?: React.ReactNode;
}

export function CLICommand({ command, children }: CLICommandProps) {
	return (
		<CodeBlock lang="bash">
			<div className="mx-3">
				<span className="flex items-start justify-start gap-2">
					<span className="text-cyan-700 dark:text-cyan-700 select-none">$</span>{" "}
					<pre>{command}</pre>
				</span>
				{children && (
					<div className="nd-copy-ignore mt-4 mb-1 text-yellow-600 dark:text-yellow-500 whitespace-break-spaces font-mono">
						{children}
					</div>
				)}
			</div>
		</CodeBlock>
	);
}
