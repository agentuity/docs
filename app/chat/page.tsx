'use client';

import { useRouter } from "next/navigation";
import { ChatInput } from "./components/ChatInput";

export default function ChatPage() {
    const router = useRouter();

    const handleMessageSend = (message: string) => {
        sessionStorage.setItem('initialMessage', message);
        router.push('/chat/new');
    };

    return (
        <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-3xl px-4">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <RecommendationCard
                        title="List all of tutorials"
                        subtitle="available in agentuity."
                        onClick={() => handleMessageSend("List all of tutorials available in agentuity")}
                    />
                    <RecommendationCard
                        title="How do we do agent hand-off"
                        subtitle="in python sdk?"
                        onClick={() => handleMessageSend("How do we do agent hand-off in python sdk?")}
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