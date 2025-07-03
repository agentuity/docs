'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import CustomSearchDialog from './CustomSearchDialog';

export default function RAGSearchToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      <button onClick={handleToggle}>
        <Sparkles className="size-4 text-cyan-700 dark:text-cyan-500" />
      </button>
      <CustomSearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
} 