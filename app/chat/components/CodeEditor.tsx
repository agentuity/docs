import React, { useRef, useEffect } from 'react';
import { Code, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeTab {
  id: string;
  content: string;
  language: string;
  label: string;
}

interface CodeEditorProps {
  codeTabs: CodeTab[];
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  closeCodeTab: (tabId: string) => void;
  toggleEditor: () => void;
}

export function CodeEditor({
  codeTabs,
  activeTabId,
  setActiveTabId,
  updateTabContent,
  closeCodeTab,
  toggleEditor
}: CodeEditorProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeCodeTab = codeTabs.find(tab => tab.id === activeTabId);

  // Handle horizontal scrolling with mouse wheel
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (!tabsContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      tabsContainer.scrollLeft += e.deltaY;
    };

    tabsContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => tabsContainer.removeEventListener('wheel', handleWheel);
  }, [codeTabs]);

  return (
    <div className="h-full flex flex-col min-w-[400px] w-full overflow-hidden border-l border-white">
      {/* Header */}
      <div className="p-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium bg-gray-700/50 text-gray-200">
                <Code className="w-3 h-3" />
                Code
              </div>
            </div>
          </div>

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

      {/* Code Tabs */}
      {codeTabs.length > 0 && (
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

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          {activeCodeTab ? (
            <div className="w-full h-full border border-gray-700/50 rounded-lg overflow-auto scrollbar-thin">
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
      </div>
    </div>
  );
}
