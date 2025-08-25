'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
	const id = useId();
	const [svg, setSvg] = useState('');
	const containerRef = useRef<HTMLDivElement>(null);
	const currentChartRef = useRef<string>(null);
	const { theme, resolvedTheme } = useTheme();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		currentChartRef.current = chart;

		async function renderChart() {
			const { default: mermaid } = await import('mermaid');
			const _theme =
				theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')
					? 'dark'
					: 'neutral';

			try {
				mermaid.initialize({
					startOnLoad: false,
					securityLevel: 'loose',
					fontFamily: 'inherit',
					themeCSS: 'margin: 1.5rem auto 0;',
					theme: _theme,
					darkMode: _theme === 'dark',
				});
				const { svg, bindFunctions } = await mermaid.render(
					id,
					chart.replaceAll('\\n', '\n')
				);

				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				bindFunctions?.(container!);
				setSvg(svg);
			} catch (error) {
				console.error('Error while rendering mermaid', error);
			}
		}

		void renderChart();
	}, [chart, id, resolvedTheme, theme]);

	return (
		<div
			ref={containerRef}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{ __html: svg }}
			className="mermaid"
		/>
	);
}
