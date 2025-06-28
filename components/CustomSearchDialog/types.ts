import type { SharedProps } from 'fumadocs-ui/components/dialog/search';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    url: string;
    content: string;
  }>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  type?: 'ai-answer' | 'document' | 'default';
}

export interface CustomSearchDialogProps extends SharedProps {}

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  handleSourceClick: (url: string) => void;
}

export interface SearchInputProps {
  currentInput: string;
  setCurrentInput: (value: string) => void;
  loading: boolean;
  sendMessage: (text: string) => void;
} 