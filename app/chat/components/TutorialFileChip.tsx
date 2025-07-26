import React, { useState } from 'react';
import { FileText, Eye, ExternalLink, X, ChevronDown } from 'lucide-react';
import { CodeBlock } from '../types';
import CodeBlockComponent from './CodeBlock';

interface TutorialFileChipProps {
    codeBlock: CodeBlock;
    onExecute: (code: string, filename: string) => Promise<void>;
    onCodeChange: (code: string, filename: string) => void;
    onOpenInEditor: (code: string) => void;
    onCloseEditor: () => void;
    executionState: 'idle' | 'running' | 'completed' | 'error';
    executionResult?: any;
    isEditorOpen: boolean;
}

export function TutorialFileChip({
    codeBlock,
    onExecute,
    onCodeChange,
    onOpenInEditor,
    onCloseEditor,
    executionState,
    executionResult,
    isEditorOpen
}: TutorialFileChipProps) {
    const [showInline, setShowInline] = useState(false);

    const getLineCount = () => {
        return codeBlock.content.split('\n').length;
    };

    const handlePrimaryAction = () => {
        if (!showInline) {
            // State 1: Collapsed -> Inline View
            onCloseEditor();
            setShowInline(true);
        } else {
            // State 2: Inline View -> Open Editor
            onOpenInEditor(codeBlock.content);
        }
    };

    const getButtonConfig = () => {
        if (!showInline) {
            return { text: 'View Code', icon: Eye, className: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' };
        } else {
            return { text: 'Open in Editor', icon: ExternalLink, className: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' };
        }
    };

    const buttonConfig = getButtonConfig();
    const IconComponent = buttonConfig.icon;

    return (
        <div className="mt-3 space-y-3">
            {/* File Chip */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-200">{codeBlock.filename}</div>
                        <div className="text-xs text-gray-400">{codeBlock.language}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrimaryAction}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${buttonConfig.className}`}
                    >
                        <IconComponent className="w-3 h-3" />
                        {buttonConfig.text}
                    </button>
                </div>
            </div>

            {/* Collapsed view - show line count */}
            {!showInline && (
                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-sm text-gray-400">
                        {getLineCount()} lines of code
                    </div>
                </div>
            )}

            {/* Inline Code Block (shown when expanded) */}
            {showInline && (
                <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
                    <div className="flex items-center justify-end p-3">
                        <button
                            onClick={() => setShowInline(false)}
                            className="text-xs text-gray-400 hover:text-gray-300"
                        >
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-4">
                        <CodeBlockComponent
                            filename={codeBlock.filename}
                            content={codeBlock.content}
                            language={codeBlock.language}
                            editable={false}
                            onExecute={onExecute}
                            onCodeChange={(code) => onCodeChange(code, codeBlock.filename)}
                            executionResult={executionResult}
                            loading={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
} 