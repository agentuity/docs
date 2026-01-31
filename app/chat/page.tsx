'use client';

import { useRouter } from "next/navigation";
import { ChatInput } from "./components/ChatInput";
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
    const router = useRouter();

    const handleMessageSend = (message: string) => {
        const newSessionId = uuidv4();
        const trimmed = message.trim();
        if (trimmed) {
            sessionStorage.setItem(`initialMessage:${newSessionId}`, trimmed);
        }
        router.push(`/chat/${newSessionId}`);
    };

    return (
        <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-3xl px-4">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <RecommendationCard
                        title="List all tutorials"
                        subtitle="available in Agentuity."
                        onClick={() => handleMessageSend("List all tutorials available in Agentuity")}
                    />
                    <RecommendationCard
                        title="What's the difference between"
                        subtitle="Route and Agent in Agentuity?"
                        onClick={() => handleMessageSend("What's the difference between Route and Agent?")}
                    />
                </div>
                <ChatInput onSendMessage={handleMessageSend} />
            </div>
        </div>
    );
}


interface RecommendationCardProps {
    title: string;
    subtitle: string;
    onClick: () => void;
}

const RecommendationCard = ({ title, subtitle, onClick }: RecommendationCardProps) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-start p-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] border"
        >
            <div className="font-medium text-sm mb-0.5">{title}</div>
            <div className="text-xs opacity-70">{subtitle}</div>
        </button>
    );
};