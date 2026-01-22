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

// Agentuity backend config
const DEFAULT_AGENT_BASE_URL = 'https://p0f83a312791b60ff.agentuity.run';
const AGENT_BASE_URL = process.env.AGENT_BASE_URL || DEFAULT_AGENT_BASE_URL;
const AGENT_BEARER_TOKEN = process.env.AGENT_BEARER_TOKEN;

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	let userId = request.cookies.get(COOKIE_NAME)?.value;

	// Ensure user has a chat_user_id cookie
	const needsCookie = !userId;
	if (needsCookie) {
		userId = uuidv4();
	}

	// Proxy API requests to Agentuity backend with bearer token
	if (pathname.startsWith('/api/sessions') || pathname === '/api/agent_pulse' || pathname === '/api/doc-qa') {
		// AGENT_BEARER_TOKEN is required for authenticated endpoints
		if (!AGENT_BEARER_TOKEN) {
			console.error('[middleware] Missing required env var: AGENT_BEARER_TOKEN');
			return NextResponse.json(
				{ error: 'Server misconfigured: missing AGENT_BEARER_TOKEN' },
				{ status: 503 }
			);
		}

		const destinationUrl = new URL(pathname + request.nextUrl.search, AGENT_BASE_URL);

		console.log(`[middleware] Proxying ${pathname} -> ${destinationUrl.toString()}`);

		// Create headers with bearer token
		const headers = new Headers(request.headers);
		headers.set('Authorization', `Bearer ${AGENT_BEARER_TOKEN}`);

		const response = NextResponse.rewrite(destinationUrl, {
			request: { headers },
		});

		// Set cookie if needed
		if (needsCookie) {
			response.cookies.set(COOKIE_NAME, userId!, {
				maxAge: COOKIE_MAX_AGE,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
			});
		}

		return response;
	}

	// Default response
	const response = NextResponse.next();

	// Set cookie if needed
	if (needsCookie) {
		response.cookies.set(COOKIE_NAME, userId!, {
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
