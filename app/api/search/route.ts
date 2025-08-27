import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Export the default fumadocs search handler
export const { GET } = createFromSource(source);
