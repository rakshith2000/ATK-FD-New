import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    FaFileAlt,
    FaRegUser,
    FaExclamationTriangle,
    FaTimes,
    FaCloud,
    FaDesktop,
    FaLinux,
    FaNetworkWired,
    FaDatabase,
    FaCheckCircle,
    FaPlus,
    FaCircle,
    FaCog,
} from 'react-icons/fa';
import { FiCpu } from 'react-icons/fi';
import { BiLoaderAlt } from 'react-icons/bi';
import { HiMicrophone, HiStop } from 'react-icons/hi';
import { MdUploadFile } from 'react-icons/md';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { extractTextFromDocument, validateDocumentFile } from '../utils/documentProcessor';
import RenderMarkdown from '../../../shared/components/smart/RenderMarkdown/RenderMarkdown';
import { SvgBotIcon } from '@/shared/utils/SvgBotIcon';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'error';
    content: string | Record<string, unknown> | null;
    inputType?: 'text' | 'voice' | 'document';
    timestamp?: string;
    suggestions?: string[];
    phase?: string;
    category?: string;
    is_complete?: boolean;
}

interface SopGeneratorChatProps {
    messages: ChatMessage[];
    isConnected: boolean;
    isReconnecting: boolean;
    isProcessing: boolean;
    onSendMessage: (content: string, inputType: 'text' | 'voice' | 'document') => void;
    onStartNewSession: () => void;
    initialMessage?: string;
}

const QUICK_START_OPTIONS = [
    {
        label: 'Jenkins Job Failure',
        category: 'application',
        prompt: 'Create an SOP for investigating and resolving a Jenkins pipeline build failure using MCP tools — ticket type: Incident',
    },
    { label: 'GitLab Project Create', category: 'application', prompt: 'Create an SOP for creating a new GitLab project (repository) using MCP tools — ticket type: Request' },
    { label: 'AWS EC2 Start/Stop', category: 'cloud', prompt: 'Create an SOP for starting and stopping an AWS EC2 EBS-backed instance — ticket type: Service Request' },
    { label: 'Linux Service Down', category: 'linux', prompt: 'Create an SOP for resolving a Linux systemctl service that is stopped or unresponsive — ticket type: Incident' },
    { label: 'Windows High CPU', category: 'windows', prompt: 'Create an SOP for investigating and resolving high CPU utilization on a Windows Server — ticket type: Incident' },
    {
        label: 'GCP Firewall Remediation',
        category: 'cloud',
        prompt: 'Create an SOP for remediating GCP VPC firewall rules that allow unrestricted inbound access from 0.0.0.0/0 — ticket type: Request',
    },
];

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
    info: { label: 'Gathering Info', color: '#6366f1' },
    access: { label: 'Access & Connectivity', color: '#0891b2' },
    steps: { label: 'Building Steps', color: '#0284c7' },
    escalation: { label: 'Escalation Details', color: '#d97706' },
    complete: { label: 'SOP Complete', color: '#16a34a' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    application: <FaCog />,
    cloud: <FaCloud />,
    windows: <FaDesktop />,
    linux: <FaLinux />,
    network: <FaNetworkWired />,
    database: <FaDatabase />,
    default: <FaFileAlt />,
};

/* --- Shared UI Components --- */

const TypingDots = () => (
    <span className="inline-flex gap-1 items-center px-1">
        {[0, 150, 300].map((d) => (
            <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
    </span>
);

const Avatar = ({ role }: { role: 'user' | 'assistant' | 'error' }) => {
    if (role === 'user') {
        return (
            <div className="w-6.5 h-6.5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold mt-0.5 text-(--brand-color)">
                <FaRegUser size={14} />
            </div>
        );
    }

    if (role === 'error') {
        return (
            <div className="w-6.5 h-6.5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold mt-0.5 text-(--brand-color)">
                <FaExclamationTriangle size={14} className="text-red-500" />
            </div>
        );
    }

    return (
        <div className="shrink-0 mt-0.5">
            <SvgBotIcon size={40} />
        </div>
    );
};

const CopyIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CopyButton = ({ text, isUserBubble }: { text: string; isUserBubble: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const blob = new Blob([text], { type: 'text/plain' });
            await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy message'}
            className={`
                opacity-0 group-hover:opacity-100 transition-opacity duration-150
                p-1 rounded cursor-pointer
                ${isUserBubble ? 'text-blue-200 hover:text-white hover:bg-blue-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}
                ${copied ? 'opacity-100' : ''}
            `}
        >
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
};

const MessageRow = ({ role, content, timestamp }: { role: 'user' | 'assistant' | 'error'; content: string | Record<string, unknown> | null; timestamp?: string }) => {
    if (!content) return null;
    const isUser = role === 'user';
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    const formatTimestamp = (ts?: string) => {
        if (!ts) return '';
        const date = new Date(ts);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex gap-1.5 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <Avatar role={role} />
            <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 text-[10px] text-gray-400 ${isUser ? 'justify-end' : ''}`}>
                    <span className="font-bold">{isUser ? 'You' : role === 'assistant' ? 'Assistant' : 'Error'}</span>
                    {timestamp && <span>{formatTimestamp(timestamp)}</span>}
                </div>
                <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-full overflow-auto break-words ${
                        isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'brand-box-show-inset text-(--brand-text-color) rounded-tl-sm'
                    }`}
                >
                    {isUser ? textContent : <RenderMarkdown text={textContent} />}
                </div>
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <CopyButton text={textContent} isUserBubble={isUser} />
                </div>
            </div>
        </div>
    );
};

/* --- Main Component --- */

export default function SopGeneratorChat({ messages, isConnected, isReconnecting, isProcessing, onSendMessage, onStartNewSession, initialMessage }: SopGeneratorChatProps) {
    const [inputValue, setInputValue] = useState(initialMessage || '');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingDocument, setIsProcessingDocument] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (initialMessage) setInputValue(initialMessage);
    }, [initialMessage]);

    const {
        finalTranscript,
        interimTranscript,
        listening,
        isProcessing: voiceProcessing,
        startListening,
        stopListening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useVoiceRecorder();

    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing, isProcessingDocument, voiceProcessing]);

    useEffect(() => {
        if (finalTranscript) {
            setInputValue((prev) => prev + finalTranscript);
            autoResize();
        }
    }, [finalTranscript]);

    useEffect(() => {
        if (
            interimTranscript &&
            !listening &&
            (interimTranscript.includes('microphone') || interimTranscript.includes('access denied') || interimTranscript.includes('not found'))
        ) {
            setError(interimTranscript);
            resetTranscript();
        }
    }, [interimTranscript, listening, resetTranscript]);

    useEffect(() => {
        setIsRecording(listening);
        if (!listening && isRecording) setIsRecording(false);
    }, [listening, isRecording]);

    const latestSuggestions = useMemo(() => {
        const last = [...messages].reverse().find((m) => m.role === 'assistant');
        const raw = last?.suggestions || [];
        return raw.filter(
            (s) =>
                typeof s === 'string' &&
                s.trim().length > 2 &&
                s.trim().length < 100 &&
                !s.toLowerCase().includes('describe the it') &&
                !s.toLowerCase().includes('type your message') &&
                !s.toLowerCase().includes('connecting...'),
        );
    }, [messages]);

    const currentPhase = useMemo(() => {
        const last = [...messages].reverse().find((m) => m.role === 'assistant');
        return last?.phase || null;
    }, [messages]);

    const currentCategory = useMemo(() => {
        const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.category);
        return last?.category || null;
    }, [messages]);

    const isSOPComplete = useMemo(() => {
        return messages.some((m) => m.role === 'assistant' && m.is_complete === true);
    }, [messages]);

    const handleSend = useCallback(() => {
        if (inputValue.trim() && isConnected) {
            onSendMessage(inputValue.trim(), 'text');
            setInputValue('');
            setError('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    }, [inputValue, isConnected, onSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (!isConnected || isProcessing) return;
        onSendMessage(suggestion, 'text');
        setInputValue('');
        setError('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleQuickStart = (prompt: string) => {
        setInputValue(prompt);
        setTimeout(autoResize, 0);
    };

    const handleVoiceToggle = async () => {
        if (!browserSupportsSpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }
        if (isRecording) {
            stopListening();
            setIsRecording(false);
        } else {
            resetTranscript();
            setError('');
            const result = await startListening();
            if (result === false) setIsRecording(false);
            else setIsRecording(true);
        }
    };

    const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setIsProcessingDocument(true);
            setError('');
            validateDocumentFile(file);
            const extractedText = await extractTextFromDocument(file);
            if (extractedText.trim()) {
                // Route uploads through the backend's enhancement flow (never-refuse,
                // gap-filling) so a document upload produces a structured SOP instead of
                // the strict-generation "formatting issue" fallback.
                onSendMessage(`Enhancing By fasteai\n\n${extractedText}`, 'document');
            } else {
                setError('No text content found in the document');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Error parsing document file');
        } finally {
            setIsProcessingDocument(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative flex flex-col w-full h-full bg-white border border-[#d6ebff] rounded-2xl shadow-[inset_0px_0px_20px_0px_rgba(89,172,255,0.5)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#bbddff] border-b border-[#a5d2ff] px-5 py-3 h-16 min-h-[64px] max-h-[64px] shrink-0 box-border gap-4">
                <div className="flex flex-col justify-center">
                    <h2 className="text-[15px] font-bold text-[#011a80] leading-none m-0">SOP Generator Chat</h2>
                    <div className="flex items-center gap-2 mt-2 h-4">
                        {currentCategory && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#3b5cd7] px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100 leading-none">
                                {CATEGORY_ICONS[currentCategory] || CATEGORY_ICONS.default} {currentCategory}
                            </span>
                        )}
                        {currentPhase && PHASE_LABELS[currentPhase] && (
                            <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border leading-none"
                                style={{
                                    backgroundColor: PHASE_LABELS[currentPhase].color + '15',
                                    color: PHASE_LABELS[currentPhase].color,
                                    borderColor: PHASE_LABELS[currentPhase].color + '30',
                                }}
                            >
                                {PHASE_LABELS[currentPhase].label}
                            </span>
                        )}
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold leading-none ${
                                isConnected ? 'text-green-600' : isReconnecting ? 'text-amber-500 animate-pulse' : 'text-gray-400'
                            }`}
                        >
                            <FaCircle size={6} fill="currentColor" /> {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting…' : 'Disconnected'}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onStartNewSession}
                    className="flex items-center gap-1 bg-[#02239f] text-white hover:bg-[#011a80] px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer h-8 border-none"
                >
                    <FaPlus size={10} /> New Session
                </button>
            </div>

            {/* Error Notification Bar */}
            {error && (
                <div className="mx-4 mt-3 flex items-center justify-between gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-rose-500">
                            <FaExclamationTriangle />
                        </span>
                        <span className="font-medium">{error}</span>
                    </div>
                    <button
                        type="button"
                        className="text-rose-500 hover:text-rose-700 text-base font-bold flex items-center justify-center border-none bg-transparent cursor-pointer"
                        onClick={() => setError('')}
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center my-auto px-4 py-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl shadow-xs mb-3">
                            <FiCpu />
                        </div>
                        <h3 className="text-sm font-bold text-[#011a80] mb-1">SOP Generator Assistant</h3>
                        <p className="text-xs text-gray-400 max-w-[280px] leading-normal mb-4">
                            Describe the IT operation or process you need an SOP for, or pick a quick start below.
                        </p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                            {QUICK_START_OPTIONS.map((opt, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    className="flex items-center gap-2 border border-gray-100 bg-[#f8fafd] hover:bg-blue-50/50 hover:border-blue-200 px-3 py-2 rounded-xl text-[11px] font-medium text-left text-gray-700 transition-all cursor-pointer truncate"
                                    onClick={() => handleQuickStart(opt.prompt)}
                                    disabled={!isConnected}
                                    title={opt.prompt}
                                >
                                    <span className="flex items-center shrink-0">{CATEGORY_ICONS[opt.category] || CATEGORY_ICONS.default}</span>
                                    <span className="truncate">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <MessageRow key={index} role={message.role} content={message.content} timestamp={message.timestamp} />
                        ))}

                        {(isProcessing || isProcessingDocument || voiceProcessing) && (
                            <div className="flex gap-1.5 flex-row">
                                <Avatar role="assistant" />
                                <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-3.5 py-3 text-sm brand-box-show-inset text-gray-800">
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* SOP Completion Notice */}
            {isSOPComplete && (
                <div className="mx-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs mb-2 font-medium shrink-0">
                    <span className="flex items-center text-emerald-600">
                        <FaCheckCircle />
                    </span>
                    <span>SOP is complete! Review the document on the right, then save or export it.</span>
                </div>
            )}

            {/* Quick Reply Suggestions */}
            {latestSuggestions.length > 0 && !isProcessing && messages.length > 0 && !isSOPComplete && (
                <div className="px-4 flex flex-wrap gap-2 mb-2">
                    {latestSuggestions.map((suggestion, i) => (
                        <button
                            type="button"
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={!isConnected}
                            className="text-xs px-3 py-1.5 rounded-full border border-(--brand-color) text-(--brand-color) hover:bg-(--brand-color) hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Recording Active Panel */}
            {listening && (
                <div className="mx-4 mb-2 flex flex-col gap-1 bg-blue-50 border border-blue-100 text-blue-700 p-2.5 rounded-xl text-[11px]">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="font-bold">Recording... Speak now</span>
                    </div>
                    {interimTranscript && (
                        <div className="mt-1 border-t border-blue-100/50 pt-1">
                            <span className="font-bold mr-1">Live transcription:</span>
                            <span className="italic text-gray-600">{interimTranscript}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Chat Input Container */}
            <div className="px-3 py-2.5 pb-3 border-t border-gray-100 bg-white shrink-0">
                <div
                    className={`flex items-center gap-1.5 bg-white border rounded-xl px-3 py-1.5 transition-colors shadow-xs ${
                        isConnected ? 'border-gray-300 focus-within:border-(--brand-color) focus-within:ring-1 focus-within:ring-(--brand-color)' : 'border-gray-200'
                    }`}
                >
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            autoResize();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={isConnected ? 'Describe the IT operation or process...' : isReconnecting ? 'Reconnecting…' : 'Connecting...'}
                        disabled={!isConnected || isProcessingDocument}
                        className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none leading-relaxed disabled:opacity-40"
                        style={{ maxHeight: '150px' }}
                    />

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-500 hover:text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                            onClick={handleVoiceToggle}
                            disabled={!isConnected || isProcessingDocument || !browserSupportsSpeechRecognition}
                            title={isRecording ? 'Stop recording' : 'Start voice input'}
                        >
                            {isRecording ? (
                                <HiStop className="text-rose-500 text-base" />
                            ) : voiceProcessing ? (
                                <BiLoaderAlt className="animate-spin text-base" />
                            ) : (
                                <HiMicrophone className="text-base" />
                            )}
                        </button>

                        <button
                            type="button"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-500 hover:text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!isConnected || isProcessingDocument}
                            title="Upload document (PDF or Word)"
                        >
                            {isProcessingDocument ? <BiLoaderAlt className="animate-spin text-base" /> : <MdUploadFile className="text-base" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" onChange={handleDocumentUpload} style={{ display: 'none' }} />

                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || !isConnected || isProcessingDocument || voiceProcessing}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isProcessing ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" className="animate-spin">
                                    <defs>
                                        <linearGradient id="sop_grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#011a80" />
                                            <stop offset="100%" stopColor="#1887f6" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="url(#sop_grad)" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                                    <defs>
                                        <linearGradient id="sop_grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#011a80" />
                                            <stop offset="100%" stopColor="#1887f6" />
                                        </linearGradient>
                                    </defs>
                                    <line x1="22" y1="2" x2="11" y2="13" stroke="url(#sop_grad)" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="url(#sop_grad)" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
