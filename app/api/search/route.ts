import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Export the default fumadocs search handler
export const { GET } = createFromSource(source);
