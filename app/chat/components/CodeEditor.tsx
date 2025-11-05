import React, { useState, useRef, useEffect } from 'react';
import { Play, Terminal, Square, Power, Code, X, Copy, Check } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

enum TabType {
  CODE = 'code',
  OUTPUT = 'output'
}

interface CodeTab {
  id: string;
  content: string;
  language: string;
  label: string;
}

interface CodeEditorProps {
  executionResult: string | null;
  serverRunning: boolean;
  executingFiles: string[];
  runCode: (code: string, language: string) => void;
  stopServer: () => void;
  codeTabs: CodeTab[];
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  closeCodeTab: (tabId: string) => void;
  toggleEditor: () => void;
}

export function CodeEditor({
  executionResult,
  serverRunning,
  runCode,
  stopServer,
  codeTabs,
  activeTabId,
  setActiveTabId,
  updateTabContent,
  closeCodeTab,
  toggleEditor
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.CODE);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const activeCodeTab = codeTabs.find(tab => tab.id === activeTabId);

  // Auto-switch to Output tab when code execution completes
  useEffect(() => {
    if (executionResult) {
      setActiveTab(TabType.OUTPUT);
    }
  }, [executionResult]);

  // Handle copying code to clipboard
  const handleCopyCode = async () => {
    if (!activeCodeTab) return;

    try {
      await navigator.clipboard.writeText(activeCodeTab.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleRunCode = () => {
    if (activeCodeTab) {
      runCode(activeCodeTab.content, activeCodeTab.language);
    }
  };

  // Handle horizontal scrolling with mouse wheel
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (!tabsContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      tabsContainer.scrollLeft += e.deltaY;
    };

    // Add event listener with passive: false to allow preventDefault
    tabsContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      tabsContainer.removeEventListener('wheel', handleWheel);
    };
  }, [codeTabs]);

  return (
    <div className="h-full flex flex-col min-w-[400px] w-full overflow-hidden border-l border-white">
      {/* Tab Header */}
      <div className="p-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab(TabType.CODE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === TabType.CODE
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Code className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => setActiveTab(TabType.OUTPUT)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === TabType.OUTPUT
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Terminal className="w-3 h-3" />
                Output
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {serverRunning && (
              <button
                onClick={stopServer}
                className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                aria-label="Stop server"
                title="Stop Server"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleRunCode}
              disabled={serverRunning || !activeCodeTab}
              className={`p-2 rounded-md transition-colors ${serverRunning || !activeCodeTab
                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              aria-label={serverRunning ? 'Server is running' : 'Run code'}
              title={serverRunning ? 'Server Running' : 'Run Code'}
            >
              {serverRunning ? (
                <Power className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={toggleEditor}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-md transition-colors"
              aria-label="Close editor"
              title="Close Editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Tabs - Only show when on CODE tab */}
      {activeTab === TabType.CODE && codeTabs.length > 0 && (
        <div 
          ref={tabsContainerRef}
          className="flex items-center gap-1 px-2 py-2 bg-gray-900/30 border-b border-gray-700/30 overflow-x-auto scrollbar-thin"
        >
          {codeTabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                tab.id === activeTabId
                  ? 'bg-gray-700/70 text-gray-200'
                  : 'bg-gray-800/40 text-gray-400 hover:text-gray-300 hover:bg-gray-700/40'
              }`}
            >
              <button
                onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-2 truncate max-w-[200px]"
                title={tab.label}
              >
                <span className="truncate">{tab.label}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeCodeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                aria-label="Close tab"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === TabType.CODE ? (
          <div className="h-full p-4">
            {activeCodeTab ? (
              <div className="relative w-full h-full border border-gray-700/50 rounded-lg overflow-auto scrollbar-thin">
                {/* Copy button positioned over code editor */}
                <button
                  onClick={handleCopyCode}
                  className={`absolute top-2 right-2 z-10 p-2 rounded-md transition-colors ${
                    copied
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
                  }`}
                  aria-label={copied ? 'Copied!' : 'Copy code'}
                  title={copied ? 'Copied!' : 'Copy Code'}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <CodeMirror
                  value={activeCodeTab.content}
                  height="100%"
                  theme={oneDark}
                  extensions={[javascript({ jsx: true, typescript: true }), python()]}
                  onChange={(value) => updateTabContent(activeCodeTab.id, value)}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    indentOnInput: true,
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No code tabs open. Click the code icon on a code block to open it here.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full p-4">
            <div className="w-full h-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm font-mono text-gray-200 overflow-auto">
              {executionResult ? (
                <pre className="whitespace-pre-wrap">{executionResult}</pre>
              ) : (
                <span className="text-gray-400">No output yet. Run some code to see results.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 