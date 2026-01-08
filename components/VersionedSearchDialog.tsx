'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
import {
	SearchDialog,
	SearchDialogContent,
	SearchDialogFooter,
	SearchDialogHeader,
	SearchDialogInput,
	SearchDialogList,
	type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { usePathname } from 'next/navigation';

export default function VersionedSearchDialog(props: SharedProps) {
	const pathname = usePathname();
	const version = pathname.startsWith('/v0') ? 'v0' : 'v1';

	// useDocsSearch(client, locale, tag, delayMs, allowEmpty, key)
	const { search, setSearch, query } = useDocsSearch(
		{ type: 'fetch' },
		undefined, // locale
		version // tag
	);

	return (
		<SearchDialog search={search} onSearchChange={setSearch} {...props}>
			<SearchDialogContent>
				<SearchDialogHeader>
					<SearchDialogInput />
				</SearchDialogHeader>
				<SearchDialogList
					items={query.data === 'empty' ? [] : query.data}
				/>
				<SearchDialogFooter />
			</SearchDialogContent>
		</SearchDialog>
	);
}
