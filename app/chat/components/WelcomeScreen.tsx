import { HelpCircle, BookOpen, Code, FileQuestion } from 'lucide-react';

interface WelcomeScreenProps {
  onButtonClick?: (action: 'tutorials' | 'sdk' | 'example') => void;
}

export const WelcomeScreen = ({ onButtonClick }: WelcomeScreenProps) => {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
        <HelpCircle className="w-10 h-10 text-cyan-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-200 mb-4">
        Welcome to Agentuity
      </h3>
      <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed mb-8">
        Your platform for building, deploying, and managing powerful AI agents
      </p>

      {/* Quick Start Options */}
      <div className="flex flex-col gap-3 max-w-md mx-auto mb-8">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Quick Start Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => onButtonClick?.('tutorials')}
            className="flex items-center gap-2 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-102"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Tutorials</span>
          </button>

          <button
            onClick={() => onButtonClick?.('sdk')}
            className="flex items-center gap-2 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-102"
          >
            <Code className="w-4 h-4" />
            <span>Learn About SDK</span>
          </button>

          <button
            onClick={() => onButtonClick?.('example')}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-102 md:col-span-2"
          >
            <FileQuestion className="w-4 h-4" />
            <span>See Example Agent</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 max-w-sm mx-auto">
        Or type your question below to get started with Agentuity
      </div>
    </div>
  );
}; 