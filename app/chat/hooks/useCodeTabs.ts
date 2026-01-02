'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CodeTab {
    id: string;
    content: string;
    language: string;
    label: string;
    identifier?: string;
}

function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString(36);
}

function extractLabel(identifier: string | undefined, language: string): string {
    if (identifier) {
        const parts = identifier.split('/');
        return parts[parts.length - 1];
    }
    return `${language} snippet`;
}

export function useCodeTabs() {
    const [editorOpen, setEditorOpen] = useState(false);
    const [tabs, setTabs] = useState<CodeTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [minimizedBlocks, setMinimizedBlocks] = useState<Set<string>>(new Set());

    const addTab = useCallback((
        code: string,
        language: string,
        label?: string,
        identifier?: string
    ) => {
        const tabIdentifier = identifier || `${language}-${hashCode(code)}`;

        setTabs(prev => {
            // Check for existing tab using prev state
            const existing = prev.find(t => t.identifier === tabIdentifier);
            if (existing) {
                setActiveTabId(existing.id);
                setEditorOpen(true);
                setMinimizedBlocks(p => new Set(p).add(tabIdentifier));
                return prev; // No change to tabs
            }

            // Create new tab with ID generated outside setState
            const newTabId = uuidv4();
            const newTab: CodeTab = {
                id: newTabId,
                content: code,
                language,
                label: label || extractLabel(identifier, language),
                identifier: tabIdentifier,
            };

            setActiveTabId(newTabId);
            setEditorOpen(true);
            setMinimizedBlocks(p => new Set(p).add(tabIdentifier));
            return [...prev, newTab];
        });
    }, []);

    const closeTab = useCallback((tabId: string) => {
        setTabs(prev => {
            const tab = prev.find(t => t.id === tabId);
            const filtered = prev.filter(t => t.id !== tabId);

            if (tab?.identifier) {
                setMinimizedBlocks(p => {
                    const s = new Set(p);
                    s.delete(tab.identifier!);
                    return s;
                });
            }

            if (filtered.length === 0) {
                setEditorOpen(false);
                setActiveTabId(null);
            } else {
                setActiveTabId(current =>
                    current === tabId ? filtered[filtered.length - 1].id : current
                );
            }

            return filtered;
        });
    }, []);

    const toggleMinimized = useCallback((identifier: string) => {
        setMinimizedBlocks(prev => {
            const s = new Set(prev);
            s.has(identifier) ? s.delete(identifier) : s.add(identifier);
            return s;
        });
    }, []);

    const updateContent = useCallback((tabId: string, content: string) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content } : t));
    }, []);

    const closeEditor = useCallback(() => setEditorOpen(false), []);

    return {
        editorOpen,
        tabs,
        activeTabId,
        minimizedBlocks,
        setActiveTabId,
        addTab,
        closeTab,
        toggleMinimized,
        updateContent,
        closeEditor,
    };
}
