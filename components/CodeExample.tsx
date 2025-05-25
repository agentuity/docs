import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

interface CodeExampleProps {
	py: string;
	js: string;
}

export function CodeExample({ py, js }: CodeExampleProps) {
	return (
		<Tabs
			items={["TypeScript", "Python"]}
			persist
			groupId="code-examples"
			className="code-example"
		>
			<Tab value="TypeScript" className="typescript">
				<DynamicCodeBlock code={js} lang="js" />
			</Tab>
			<Tab value="Python" className="python">
				<DynamicCodeBlock code={py} lang="py" />
			</Tab>
		</Tabs>
	);
}
