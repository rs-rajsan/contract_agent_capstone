import { ReactNode } from "react";
import { Loader } from "../../shared/ui/loader";
import { Message } from "./provider";
import { Sparkles, CircleUser, Cpu, CheckCircle2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface Props {
    message: Message;
}

export function ChatMessage({ message }: Props) {
    const { type, parts, generating } = message;
    const isAi = type === "ai";

    return (
        <div className={cn(
            "flex w-full gap-4 px-2 py-4 group animate-in slide-in-from-bottom-2 duration-300",
            isAi ? "flex-row" : "flex-row-reverse"
        )}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2 shrink-0">
                <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105",
                    isAi ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                )}>
                    {isAi ? <Sparkles className="w-4 h-4" /> : <CircleUser className="w-5 h-5" />}
                </div>
            </div>

            {/* Bubble Section */}
            <div className={cn(
                "flex flex-col max-w-[85%] space-y-2",
                isAi ? "items-start" : "items-end"
            )}>
                {/* Meta Header */}
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isAi ? "Autonomous Intelligence" : "User Proxy"}
                    </span>
                </div>

                {/* Content Bubble */}
                <div className={cn(
                    "relative px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all",
                    isAi 
                        ? "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-sm" 
                        : "bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/10"
                )}>
                    <div className="space-y-4">
                        {parts.map(({ content, type }, index) => {
                            switch (type) {
                                case "tool_call":
                                    return null;
                                case "tool_message":
                                    return null;
                                default:
                                    let displayContent: ReactNode = content;
                                    if (typeof content === 'object' && content !== null) {
                                        if (Array.isArray(content)) {
                                            displayContent = (content as any[]).map((c: any) => c.text || JSON.stringify(c)).join('');
                                        } else {
                                            displayContent = (content as any).text || JSON.stringify(content);
                                        }
                                    }
                                    return (
                                        <div 
                                            key={index} 
                                            className="whitespace-pre-wrap break-words"
                                            style={{ color: 'inherit' }}
                                        >
                                            {displayContent as string}
                                        </div>
                                    );
                            }
                        })}
                    </div>

                    {/* Generation Loader */}
                    {generating && (
                        <div className="mt-4 flex items-center gap-2 py-1 px-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg w-fit">
                            <Loader className="w-3 h-3 text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-500 uppercase animate-pulse">Synthesizing...</span>
                        </div>
                    )}
                </div>

                {/* Optional: Footer Action (Copy/Feedback) can go here */}
            </div>
        </div>
    );
}
