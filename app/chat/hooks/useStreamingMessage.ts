'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface StreamingState {
    isStreaming: boolean;
    messageId: string | null;
}

interface UseStreamingMessageReturn {
    streamingState: StreamingState;
    appendText: (text: string, messageId: string) => void;
    finishStreaming: () => string;
    cancelStreaming: () => void;
}

export function useStreamingMessage(
    onTextUpdate: (messageId: string, text: string) => void
): UseStreamingMessageReturn {
    const charQueueRef = useRef<string>('');
    const messageIdRef = useRef<string | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTypeTimeRef = useRef<number>(0);

    const [streamingState, setStreamingState] = useState<StreamingState>({
        isStreaming: false,
        messageId: null,
    });

    // Store callback in ref to avoid recreating typewriter loop
    const onTextUpdateRef = useRef(onTextUpdate);
    onTextUpdateRef.current = onTextUpdate;

    // Typewriter loop - runs via requestAnimationFrame
    const typewriterLoop = useCallback((timestamp: number) => {
        const messageId = messageIdRef.current;
        if (!messageId) {
            animationFrameRef.current = null;
            return;
        }

        const timeSinceLastType = timestamp - lastTypeTimeRef.current;
        const queueLength = charQueueRef.current.length;

        // Dynamic speed based on queue size
        let charsPerUpdate = 3;
        let updateInterval = 20;
        if (queueLength > 200) {
            charsPerUpdate = 10;
            updateInterval = 16;
        } else if (queueLength > 50) {
            charsPerUpdate = 5;
            updateInterval = 16;
        }

        if (queueLength > 0 && timeSinceLastType >= updateInterval) {
            const charsToAdd = charQueueRef.current.slice(0, charsPerUpdate);
            charQueueRef.current = charQueueRef.current.slice(charsPerUpdate);
            lastTypeTimeRef.current = timestamp;
            onTextUpdateRef.current(messageId, charsToAdd);
        }

        if (messageIdRef.current) {
            animationFrameRef.current = requestAnimationFrame(typewriterLoop);
        }
    }, []);

    const appendText = useCallback((text: string, messageId: string) => {
        charQueueRef.current += text;
        messageIdRef.current = messageId;

        setStreamingState({ isStreaming: true, messageId });

        // Start animation if not running
        if (!animationFrameRef.current) {
            lastTypeTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(typewriterLoop);
        }
    }, [typewriterLoop]);

    const finishStreaming = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const remaining = charQueueRef.current;
        charQueueRef.current = '';
        messageIdRef.current = null;

        setStreamingState({ isStreaming: false, messageId: null });
        return remaining;
    }, []);

    const cancelStreaming = useCallback(() => {
        finishStreaming();
    }, [finishStreaming]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return { streamingState, appendText, finishStreaming, cancelStreaming };
}
