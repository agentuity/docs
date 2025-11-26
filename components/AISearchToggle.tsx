'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import CustomSearchDialog from './CustomSearchDialog';

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
				className="flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 transform-origin-center border border-fd-border rounded-lg size-10 bg-fd-secondary/50 hover:bg-fd-accent"
			>
				<Sparkles className="size-4 text-fd-muted-foreground" />
			</button>
			<CustomSearchDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
