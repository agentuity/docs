/**
 * Detect if we're running in a Cloudflare Workers environment
 */
export function isCloudflareWorkers(): boolean {
  return typeof (globalThis as any).caches !== 'undefined' && 
         typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
         typeof process === 'undefined' ||
         (typeof process !== 'undefined' && process.env?.CF_PAGES === '1') ||
         (typeof process !== 'undefined' && process.env?.CLOUDFLARE_ENV !== undefined);
}

/**
 * Detect if we're running in a Node.js environment where agent code can be loaded
 */
export function canLoadAgentCode(): boolean {
  return !isCloudflareWorkers() && typeof process !== 'undefined';
}
