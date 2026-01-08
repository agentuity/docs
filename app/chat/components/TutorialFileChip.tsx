import React from 'react';
import { FileText } from 'lucide-react';
import type { CodeFile } from '../types';

interface TutorialFileChipProps {
    codeBlock: CodeFile;
    onOpenInEditor: (code: string) => void;
}

export function TutorialFileChip({
    codeBlock,
    onOpenInEditor,
}: TutorialFileChipProps) {
    const onFileClipClicked = () => {
        onOpenInEditor(codeBlock.content);
    }

    return (
        <div className="mt-3 space-y-3">
            <div className="inline-flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <button type="button" className="flex items-center gap-3 cursor-pointer" onClick={onFileClipClicked} aria-label={`Open ${codeBlock.filename}`}>
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-200">{codeBlock.filename}</div>
                        <div className="text-xs text-gray-400">{codeBlock.language}</div>
                    </div>
                </button>
            </div>
        </div>
    );
} 