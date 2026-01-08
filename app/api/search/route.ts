import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const { GET } = createFromSource(source, (page) => ({
	title: page.data.title,
	description: page.data.description,
	url: page.url,
	id: page.url,
	structuredData: page.data.structuredData,
	tag: page.slugs[0], // 'v0' or 'v1'
}));
