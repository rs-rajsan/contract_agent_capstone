import React, { KeyboardEvent, useRef } from "react";
import { Textarea } from "../../shared/ui/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../shared/ui/select";
import { Button } from "../../shared/ui/button";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SendHorizontal, Plus, Compass, FileText } from "lucide-react";
import { Message, MessagePart, useChat } from "./provider";

export function ChatInput() {
    const history = useRef<string[]>([])
    const [submiting, setSubmiting] = React.useState(false);
    const { messages, addMessage, addMessagePart, updateMessageGenerating } = useChat();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
    const AVAILABLE_MODELS_ENV = import.meta.env.VITE_AVAILABLE_MODELS || 'gemini-2.5-flash,gemini-1.5-pro,gpt-4o,sonnet-3.5';
    const modelOptions = AVAILABLE_MODELS_ENV.split(',').map((m: string) => m.trim());

    const actionPills = [
        { icon: Compass, label: "Strategize" },
        { icon: FileText, label: "Summary" }
    ];

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const model = formData.get("model") as string;
        const prompt = formData.get("prompt") as string;

        if (!prompt.trim()) {
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            parts: [{ content: prompt, type: "user_message" }],
            generating: false
        };

        const aiMessage: Message = {
            id: Date.now().toString() + "ai",
            type: "ai",
            parts: [],
            generating: true
        };

        addMessage(userMessage);
        addMessage(aiMessage);

        event.target.reset();

        await fetchEventSource('/api/run/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, prompt, history: JSON.stringify(history.current) }),
            onmessage(event) {
                const data: MessagePart = JSON.parse(event.data);
                if (data.type === "end") {
                    updateMessageGenerating(aiMessage.id, false);
                } else if (data.type === "history") {
                    history.current = [...history.current, ...data.content]
                } else {
                    addMessagePart(aiMessage.id, data);
                }
            },
            async onopen() {
                setSubmiting(true);
            },
            onclose() {
                setSubmiting(false);
            },
            onerror(_err) {
                setSubmiting(false);
                addMessagePart(aiMessage.id, { type: "ai_message", content: "Error: Failed to generate the response." });
                updateMessageGenerating(aiMessage.id, false);
                throw new Error('Connection closed due to error');
            }
        });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            const form = event.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
        }
    };

    return (
        <div className="flex-0 w-full max-w-3xl mx-auto px-4 pb-12 pt-4 relative space-y-4">
            <form className="relative group" onSubmit={handleSubmit}>
                <div className="relative flex flex-col bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] shadow-2xl shadow-indigo-500/5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-indigo-500/50 transition-all duration-500 overflow-hidden">
                    
                    <Textarea
                        name="prompt"
                        className="m-0 border-0 focus-visible:ring-0 bg-transparent min-h-[80px] py-6 px-8 text-base text-slate-800 dark:text-slate-100 font-medium tracking-tight resize-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                        placeholder="How can Aequitas help you today?"
                        onKeyDown={handleKeyDown}
                        ref={textareaRef}
                    />

                    <div className="flex items-center justify-between px-4 pb-4 pt-0">
                        <div className="flex items-center gap-1">
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="w-10 h-10 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select name="model" defaultValue={DEFAULT_MODEL}>
                                <SelectTrigger className="h-10 px-4 border-0 bg-transparent hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-500 focus:ring-0 transition-all w-fit gap-2 shadow-none font-black text-[10px] uppercase tracking-widest">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                    <SelectGroup>
                                        {modelOptions.map((model: string) => (
                                            <SelectItem 
                                                key={model} 
                                                value={model}
                                                className="rounded-xl focus:bg-indigo-50 dark:focus:bg-indigo-900/30 text-[10px] font-black uppercase tracking-widest p-3"
                                            >
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Button 
                                type="submit" 
                                disabled={submiting}
                                size="icon"
                                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center group/btn"
                            >
                                <SendHorizontal className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Action Pills Row - Rendered only when no messages exist */}
            {messages.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 w-full animate-in fade-in slide-in-from-top-4 duration-1000 delay-500">
                    {actionPills.map((pill, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className="h-10 px-5 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-500/30 transition-all gap-2 group shadow-sm"
                        >
                            <pill.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold tracking-tight text-slate-600 dark:text-slate-300">{pill.label}</span>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}