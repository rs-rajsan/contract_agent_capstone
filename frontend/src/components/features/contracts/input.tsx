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
import { MouseEvent } from 'react';
import { SendHorizontal } from "lucide-react";
import { Message, MessagePart, useChat } from "./provider";

export function ChatInput() {
    const history = useRef<string[]>([])
    const [submiting, setSubmiting] = React.useState(false);
    const { addMessage, addMessagePart, updateMessageGenerating, reset } = useChat();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
    const AVAILABLE_MODELS_ENV = import.meta.env.VITE_AVAILABLE_MODELS || 'gemini-2.5-flash,gemini-1.5-pro,gpt-4o,sonnet-3.5';
    const modelOptions = AVAILABLE_MODELS_ENV.split(',').map(m => m.trim());

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
        // removed console log

        // Clear the form after submission
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
            onerror(err) {
                setSubmiting(false);
                // removed console error
                addMessagePart(aiMessage.id, { type: "ai_message", content: "Error: Failed to generate the response." });
                updateMessageGenerating(aiMessage.id, false);
                throw new Error('Connection closed due to error');
            }
        });
    };

    const handleClear = (event: MouseEvent) => {
        event.preventDefault();
        reset();
        history.current = [];
        if (textareaRef.current) {
            textareaRef.current.value = "";
        }
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
        <div className="flex-0">
            <form className="flex flex-col gap-2 relative" onSubmit={handleSubmit}>
                <Textarea
                    name="prompt"
                    className="m-0 max-h-[400px]"
                    placeholder="Type your prompt here!"
                    onKeyDown={handleKeyDown}
                    ref={textareaRef}
                />
                <div className="flex gap-2">
                    <Select name="model" defaultValue={DEFAULT_MODEL}>
                        <SelectTrigger className=" flex-1 text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {modelOptions.map(model => (
                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="flex-0" onClick={handleClear}>
                        Reset
                    </Button>
                    <Button className="flex-0" type="submit" disabled={submiting}>
                        Send your prompt now!
                        <SendHorizontal />
                    </Button>
                </div>
            </form>
        </div>
    );
}