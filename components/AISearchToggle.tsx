'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
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
        onClick={handleToggle}
        className="transition-all duration-200 hover:scale-110 active:scale-95 transform-origin-center"
      >
        <Sparkles className="size-4 text-cyan-700 dark:text-cyan-500" />
      </button>
      <CustomSearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
} 