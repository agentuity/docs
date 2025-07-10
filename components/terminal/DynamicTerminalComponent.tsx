'use client';

import dynamic from 'next/dynamic';
import { Terminal } from '@xterm/xterm';

interface TerminalComponentProps {
  sessionId?: string;
  onReady?: (terminal: Terminal) => void;
  onClose?: () => void;
  className?: string;
}

// Dynamically import TerminalComponent with SSR disabled
const TerminalComponent = dynamic(() => import('./TerminalComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px', minWidth: '300px' }}>
      <div className="text-gray-400 text-center">
        <div className="animate-pulse">Loading Terminal...</div>
      </div>
    </div>
  ),
});

export default function DynamicTerminalComponent(props: TerminalComponentProps) {
  return <TerminalComponent {...props} />;
} 