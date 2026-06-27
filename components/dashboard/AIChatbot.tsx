"use client";

import { useState, useRef, useEffect } from "react";
import {
    Bot,
    Send,
    X,
    Minimize2,
    Sparkles,
    ShieldAlert,
    Search,
    MessageSquare,
    Loader2,
    Volume2,
    VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
    role: "user" | "bot";
    content: string;
    type?: "text" | "risk_report" | "action";
    timestamp: Date;
    metadata?: {
        reasoning_path?: string;
        suggested_action?: string;
        intent?: string;
        confidence?: number;
    };
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content: "Hello! I am TrueLedger AI. How can I assist you with certificate verification or fraud detection today?",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const speak = (text: string) => {
        if (!isAudioEnabled) return;
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        synth.speak(utterance);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        const messageText = overrideInput || input;
        if (!messageText.trim()) return;

        const userMsg: Message = {
            role: "user",
            content: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        if (!overrideInput) setInput("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messageText })
            });

            if (!res.ok) throw new Error("AI stream disconnected");

            const data = await res.json();

            const botMsg: Message = {
                role: "bot",
                content: data.response,
                timestamp: new Date(),
                metadata: data.metadata
            };

            setMessages(prev => [...prev, botMsg]);
            speak(data.response); // AI Voice Feedback
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: "bot",
                content: "I'm having trouble accessing my secure intelligence core. Please try again in a few seconds.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 transition-all border border-emerald-400/20 z-50 group"
            >
                <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
            </button>
        );
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 w-96 bg-black/80 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col transition-all z-50 overflow-hidden",
                isMinimized ? "h-16" : "h-[500px]"
            )}
        >
            {/* Header */}
            <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-mono font-bold">TrueLedger AI v2.4</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        className={cn(
                            "p-1.5 rounded-md transition-colors",
                            isAudioEnabled ? "text-emerald-400 bg-emerald-500/20" : "text-gray-500 hover:bg-white/10"
                        )}
                        title={isAudioEnabled ? "Disable Voice AI" : "Enable Voice AI"}
                    >
                        {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-gray-400"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Chat Container */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-900"
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col max-w-[85%]",
                                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm",
                                        msg.role === "user"
                                            ? "bg-emerald-600 text-white rounded-tr-none"
                                            : "bg-gray-900 border border-gray-800 text-gray-300 rounded-tl-none"
                                    )}
                                >
                                    {msg.content}

                                    {/* AI Reasoning Metadata (Only for Bot) */}
                                    {msg.role === "bot" && msg.metadata && (
                                        <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-emerald-500/60 flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                PATH: {msg.metadata.reasoning_path}
                                            </div>
                                            {msg.metadata.suggested_action && (
                                                <div className="bg-emerald-500/10 p-1 rounded border border-emerald-500/20 text-emerald-400">
                                                    NEXT_BIT: {msg.metadata.suggested_action}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase font-mono">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-emerald-500/50 text-xs font-mono ml-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking...
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
                        <button
                            onClick={() => setInput("Check risk levels")}
                            className="whitespace-nowrap px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 rounded-full text-[10px] text-emerald-400 hover:bg-emerald-900/40"
                        >
                            <ShieldAlert className="w-3 h-3 inline mr-1" /> Risk Levels
                        </button>
                        <button
                            onClick={() => setInput("How does AI work?")}
                            className="whitespace-nowrap px-3 py-1 bg-blue-900/20 border border-blue-500/20 rounded-full text-[10px] text-blue-400 hover:bg-blue-900/40"
                        >
                            <Search className="w-3 h-3 inline mr-1" /> Forensic Methodology
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/5 bg-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type your query..."
                                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors pr-12"
                            />
                            <button
                                onClick={() => handleSend()}
                                className="absolute right-2 top-1.5 p-1.5 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
}
