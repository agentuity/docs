import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TYPE_MAP: Record<string, string> = {
	agent: 'agents',
	auth: 'authentication',
	cli: 'cli',
	data: 'datastores',
	int: 'integration',
	proj: 'projects',
	sys: 'system',
};

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Match error code URLs
	const errorMatch = pathname.match(
		/^\/errors\/((?:CLI|AUTH|PROJ|AGENT|DATA|INT|SYS)-\d+)$/
	);

	if (errorMatch) {
		const code = errorMatch[1];
		const lowercaseCode = code.toLowerCase();
		const type = code.split('-')[0].toLowerCase();
		const mappedType = TYPE_MAP[type] || type;

		const url = new URL(request.url);
		url.pathname = `/Troubleshooting/error-codes/${mappedType}`;
		url.hash = lowercaseCode;

		return NextResponse.redirect(url);
	}
}
