import { useRef, useLayoutEffect, useCallback } from 'react';

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

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Run the measurement in the next animation frame
    // so layout has already been updated (e.g. max-height 150 px
    // after exiting fullscreen).
    requestAnimationFrame(() => {
      // Reset, then measure
      textarea.style.height = 'auto';

      let newHeight = textarea.scrollHeight;
      if (maxHeight !== undefined) newHeight = Math.min(newHeight, maxHeight);
      if (minHeight) newHeight = Math.max(newHeight, minHeight);

      textarea.style.height = `${newHeight}px`;
    });
  }, [maxHeight, minHeight]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [content, resizeTextarea]);

  // Return an object that can be used as a ref but also has additional methods
  return {
    textareaRef,
    triggerResize: resizeTextarea,
    // For backward compatibility, allow this to be used as a ref directly
    current: textareaRef.current
  };
} 