import { useRef, useEffect } from 'react';

interface UseAutoResizeOptions {
  maxHeight?: number;
  minHeight?: number;
}

export function useAutoResize(
  content: string,
  options: UseAutoResizeOptions = {}
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { maxHeight, minHeight = 0 } = options;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    let newHeight = textarea.scrollHeight;

    if (maxHeight) {
      newHeight = Math.min(newHeight, maxHeight);
    }
    if (minHeight) {
      newHeight = Math.max(newHeight, minHeight);
    }

    textarea.style.height = `${newHeight}px`;
  }, [content, maxHeight, minHeight]);

  return textareaRef;
} 