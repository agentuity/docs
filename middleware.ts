import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const TYPE_MAP: Record<string, string> = {
	agent: 'agents',
	auth: 'authentication',
	cli: 'cli',
	data: 'datastores',
	int: 'integration',
	proj: 'projects',
	sys: 'system',
};

const COOKIE_NAME = 'chat_user_id';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 14; // 14 days

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	let userId = request.cookies.get(COOKIE_NAME)?.value;
	const response = NextResponse.next();
	if (!userId) {
		userId = uuidv4();
		response.cookies.set(COOKIE_NAME, userId, {
			maxAge: COOKIE_MAX_AGE,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
		});
	}
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

	return response;
}
