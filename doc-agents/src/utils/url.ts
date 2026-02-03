/**
 * Transforms a document path (e.g., "Get-Started/quickstart.mdx#7-deploy") to a proper URL (e.g., "/Get-Started/quickstart#7-deploy")
 */
export function documentPathToUrl(docPath?: string | null): string {
	if (!docPath) {
		return '/';
	}
	// Remove the .md or .mdx extension before any # symbol
	const path = docPath.replace(/\.mdx?(?=#|$)/, '');

	// Split path and hash (if any)
	const [basePath = '', hash] = path.split('#');
	// Split the base path into segments
	const segments = basePath.split('/').filter(Boolean);

	// If the last segment is 'index', remove it
	if (
		segments.length > 0 &&
		segments[segments.length - 1]?.toLowerCase() === 'index'
	) {
		segments.pop();
	}

	// Reconstruct the path with leading slash
	let url = `/${segments.join('/')}`;
	if (url === '/') {
		url = '/';
	}
	if (hash) {
		url += `#${hash}`;
	}
	return url;
}
