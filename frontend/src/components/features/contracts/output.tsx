import { useEffect, useRef } from "react";
import { useChat } from "./provider";
import { ChatMessage } from "./message";
import { 
    Sparkles
} from "lucide-react";

export function ChatOutput() {
    const { messages } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mocking a user name fetch. In a real app, this would come from a Context or Auth provider.
    const userName = import.meta.env.VITE_USER_NAME || null;

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    };

    return (
        <div className="flex-1 relative min-h-0 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-full py-12 px-4 animate-in fade-in duration-1000">
                        <div className="w-full max-w-4xl flex flex-col items-center space-y-16">
                            
                            {/* Top Centered Branding */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 text-center whitespace-nowrap">
                                    Aequitas | Autonomous Legal Intelligence Partner
                                </span>
                            </div>

                            {/* Claude-style Centerpiece */}
                            <div className="flex flex-col items-center text-center space-y-8 mt-[-10vh]">
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-900/20 shadow-xl shadow-indigo-500/5">
                                    <Sparkles className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />
                                </div>
                                <h1 className="text-6xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                                    {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700">{userName || "my friend"}</span>
                                </h1>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
                                    Aequitas is ready to interrogate your contract repository. <br/> How can I partner with you today?
                                </p>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-6 max-w-4xl mx-auto px-4">
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                            />
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>
    );
}
