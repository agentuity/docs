'use client';

import { AgentuityProvider } from '@agentuity/react';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import CustomSearchDialog from './CustomSearchDialog';

const DOC_AGENTS_BASE_URL = process.env.NEXT_PUBLIC_DOC_AGENTS_URL;
const DOC_AGENTS_AUTH_HEADER = process.env.NEXT_PUBLIC_DOC_AGENTS_BEARER_TOKEN
	? `Bearer ${process.env.NEXT_PUBLIC_DOC_AGENTS_BEARER_TOKEN}`
	: undefined;

export default function AISearchToggle() {
	const [isOpen, setIsOpen] = useState(false);

	const handleToggle = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsOpen(true);
	};

	return (
		<>
			<button
				type="button"
				onClick={handleToggle}
				aria-label="Agent-powered search"
				className="flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 origin-center border border-fd-border rounded-lg size-10 bg-fd-secondary/50 hover:bg-fd-accent"
			>
				<Sparkles className="size-4 text-fd-muted-foreground" />
			</button>
			<AgentuityProvider baseUrl={DOC_AGENTS_BASE_URL} authHeader={DOC_AGENTS_AUTH_HEADER}>
				<CustomSearchDialog open={isOpen} onOpenChange={setIsOpen} />
			</AgentuityProvider>
		</>
	);
}
