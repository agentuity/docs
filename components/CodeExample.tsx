import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

interface CodeExampleProps {
	py?: string;
	js?: string;
}

export function CodeExample({ py, js }: CodeExampleProps) {
	if (!py && !js) {
		return null;
	}
	if (!py && js) {
		return <DynamicCodeBlock code={js} lang="js" />;
	}
	if (!js && py) {
		return <DynamicCodeBlock code={py} lang="py" />;
	}
	return (
		<Tabs
			items={['TypeScript', 'Python']}
			persist
			groupId="code-examples"
			className="code-example"
		>
			<Tab value="TypeScript" className="typescript">
				<DynamicCodeBlock code={js!} lang="js" />
			</Tab>
			<Tab value="Python" className="python">
				<DynamicCodeBlock code={py!} lang="py" />
			</Tab>
		</Tabs>
	);
}
