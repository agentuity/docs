import { useState, useCallback } from 'react';

export function useEditorManagement() {
  const [editorContent, setEditorContent] = useState(`print("Hello, World!")`);
  const [editorOpen, setEditorOpen] = useState(false);

  // Toggle editor visibility
  const toggleEditor = useCallback(() => {
    setEditorOpen(prev => !prev);
  }, []);

  return {
    editorContent,
    editorOpen,
    setEditorContent,
    setEditorOpen,
    toggleEditor
  };
} 