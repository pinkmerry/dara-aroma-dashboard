'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import {
    MessageCircle,
    X,
    Send,
    Minimize2,
    Trash2,
    Loader2,
    Bot,
    User,
    Sparkles,
    ChevronDown,
} from 'lucide-react';
import {
    executeDataTool,
    ToolName,
    getAvailablePeriods,
    DATA_TOOL_DESCRIPTIONS,
} from '@/utils/chatDataTools';

// ─── Types ───

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    dataContext?: string; // attached data for this message
}

// ─── Smart Data Selection ───
// Analyze user message to determine which data tools to call automatically

function detectRelevantTools(message: string): { tool: ToolName; params: Record<string, string | number | undefined> }[] {
    const lower = message.toLowerCase();
    const tools: { tool: ToolName; params: Record<string, string | number | undefined> }[] = [];

    // Extract year/month if mentioned
    const yearMatch = lower.match(/(ปี\s*)?(\d{4})/);
    const monthNames: Record<string, string> = {
        // Full Thai names
        'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04',
        'พฤษภาคม': '05', 'มิถุนายน': '06', 'กรกฎาคม': '07', 'สิงหาคม': '08',
        'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12',
        // Shortened Thai (common typing)
        'มกรา': '01', 'กุมภา': '02', 'มีนา': '03', 'เมษา': '04',
        'พฤษภา': '05', 'มิถุนา': '06', 'กรกฎา': '07', 'สิงหา': '08',
        'กันยา': '09', 'ตุลา': '10', 'พฤศจิกา': '11', 'ธันวา': '12',
        // With dots
        'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04',
        'พ.ค.': '05', 'มิ.ย.': '06', 'ก.ค.': '07', 'ส.ค.': '08',
        'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12',
        // Without dots (common shorthand)
        'มค': '01', 'กพ': '02', 'มีค': '03', 'เมย': '04',
        'พค': '05', 'มิย': '06', 'กค': '07', 'สค': '08',
        'กย': '09', 'ตค': '10', 'พย': '11', 'ธค': '12',
        // English
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };

    let year: string | undefined;
    let month: string | undefined;

    if (yearMatch) year = yearMatch[2];

    for (const [key, val] of Object.entries(monthNames)) {
        if (lower.includes(key)) {
            month = val;
            break;
        }
    }

    // Detect month from number pattern like "เดือน 1" "เดือน 12"
    const monthNumMatch = lower.match(/เดือน\s*(\d{1,2})/);
    if (monthNumMatch) {
        const m = parseInt(monthNumMatch[1]);
        if (m >= 1 && m <= 12) month = m.toString().padStart(2, '0');
    }

    const baseParams = { year, month };

    // ─── Intent Detection ───

    // Overview / ภาพรวม
    if (/ภาพรวม|overview|สรุป|ยอดขาย|ยอดรวม|รายได้|revenue|total/.test(lower)) {
        tools.push({ tool: 'overview', params: baseParams });
    }

    // Services / บริการ
    if (/บริการ|service|top\s*\d|อันดับ|ยอดนิยม|ขายดี|ทำยอด/.test(lower)) {
        tools.push({ tool: 'top_services', params: baseParams });
    }

    // Booking channels
    if (/ช่องทาง|channel|จอง|booking|walk.?in|line|facebook|online/.test(lower)) {
        tools.push({ tool: 'booking_channels', params: baseParams });
    }

    // Peak hours
    if (/เวลา|ช่วง|peak|hour|ชั่วโมง|เร่งด่วน|ยอดนิยม/.test(lower) && /เวลา|ช่วง|peak|hour|ชั่วโมง/.test(lower)) {
        tools.push({ tool: 'peak_hours', params: baseParams });
    }

    // Payment
    if (/ชำระ|payment|จ่าย|เงินสด|โอน|บัตรเครดิต|เงิน|cash|transfer|credit/.test(lower)) {
        tools.push({ tool: 'payment_breakdown', params: baseParams });
    }

    // Daily trend
    if (/รายวัน|daily|วันไหน|แนวโน้ม|trend|วันที่/.test(lower) && month) {
        tools.push({ tool: 'daily_trend', params: { year: year || new Date().getFullYear().toString(), month } });
    }

    // Staff
    if (/พนักงาน|staff|หมอนวด|ค่ามือ|ทิป|tip|commission|ทำเงิน|คนไหน.*ยอด|ใคร.*ยอด|ใคร.*เงิน|เก่งสุด|ดีสุด/.test(lower)) {
        tools.push({ tool: 'staff_summary', params: baseParams });
    }

    // Comparison
    if (/เปรียบเทียบ|compar|vs|เทียบ|กับเดือน/.test(lower)) {
        tools.push({ tool: 'overview', params: baseParams });
        if (!tools.find(t => t.tool === 'top_services')) {
            tools.push({ tool: 'top_services', params: baseParams });
        }
    }

    // If nothing detected, provide overview as default context
    if (tools.length === 0) {
        tools.push({ tool: 'overview', params: baseParams });
    }

    // Cap tools at 3 to prevent token explosion
    return tools.slice(0, 3);
}

// ─── Markdown renderer ───

function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
            elements.push(
                <h4 key={i} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1">
                    {renderInline(trimmed.slice(4))}
                </h4>
            );
        } else if (trimmed.startsWith('## ')) {
            elements.push(
                <h3 key={i} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1">
                    {renderInline(trimmed.slice(3))}
                </h3>
            );
        } else if (trimmed.startsWith('# ')) {
            elements.push(
                <h2 key={i} className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1">
                    {renderInline(trimmed.slice(2))}
                </h2>
            );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            elements.push(
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 ml-4 list-disc">
                    {renderInline(trimmed.slice(2))}
                </li>
            );
        } else if (/^\d+\.\s/.test(trimmed)) {
            const content = trimmed.replace(/^\d+\.\s/, '');
            elements.push(
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 ml-4 list-decimal">
                    {renderInline(content)}
                </li>
            );
        } else if (trimmed === '━━━━━━━━━━━━━━━━━━━━' || trimmed === '---') {
            elements.push(
                <hr key={i} className="border-slate-200 dark:border-slate-700 my-2" />
            );
        } else if (trimmed === '') {
            elements.push(<div key={i} className="h-1" />);
        } else {
            elements.push(
                <p key={i} className="text-sm text-slate-700 dark:text-slate-300">
                    {renderInline(trimmed)}
                </p>
            );
        }
    });

    return elements;
}

function renderInline(text: string): React.ReactNode {
    // Bold
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={i} className="font-semibold text-slate-900 dark:text-white">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

// ─── Component ───

export default function ChatBot() {
    const { serviceData, isDataLoaded } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    // Track scroll position for "scroll down" button
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setShowScrollDown(!isBottom);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Get available periods string for system prompt
    const availablePeriodsStr = React.useMemo(() => {
        if (!isDataLoaded || serviceData.length === 0) return 'ยังไม่มีข้อมูล';
        const periods = getAvailablePeriods(serviceData);
        return `ปีที่มี: ${periods.years.join(', ')}\nเดือนที่มี: ${periods.months.map(m => m.label).join(', ')}`;
    }, [serviceData, isDataLoaded]);

    // ─── Send Message ───
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        // Create user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        // Smart data selection: detect what data the AI needs
        let dataContext = '';
        if (isDataLoaded && serviceData.length > 0) {
            const relevantTools = detectRelevantTools(text);
            const dataResults: string[] = [];

            // Build metadata about what filters were applied
            const filterInfo: string[] = [];

            for (const { tool, params } of relevantTools) {
                try {
                    const result = executeDataTool(serviceData, tool, params);
                    if (result && !result.includes('ไม่พบข้อมูล')) {
                        dataResults.push(result);
                        const yearInfo = params.year ? `ปี ${params.year}` : 'ทุกปี';
                        const monthInfo = params.month ? `เดือน ${params.month}` : 'ทุกเดือน';
                        filterInfo.push(`${tool} (${yearInfo}, ${monthInfo})`);
                    }
                } catch (e) {
                    // Silent fail — AI will mention data unavailability
                }
            }

            if (dataResults.length > 0) {
                const meta = `[ข้อมูลด้านล่างถูกดึงจากระบบแล้ว ตาม filter: ${filterInfo.join(', ')}]`;
                dataContext = meta + '\n\n' + dataResults.join('\n\n');
            }
        }

        userMessage.dataContext = dataContext;

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Prepare messages for API (exclude dataContext from display but include in API)
        const apiMessages = [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            ...(m.dataContext ? { dataContext: m.dataContext } : {}),
        }));

        // Create assistant message placeholder
        const assistantId = (Date.now() + 1).toString();
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    availablePeriods: availablePeriodsStr,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Stream the response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let accumulated = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulated += chunk;

                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantId ? { ...m, content: accumulated } : m
                        )
                    );
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;

            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantId
                        ? { ...m, content: `❌ ${error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ'}` }
                        : m
                )
            );
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    // ─── Key handler ───
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ─── Clear chat ───
    const clearChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setMessages([]);
        setIsLoading(false);
    };

    // ─── Suggested questions ───
    const suggestions = [
        'ภาพรวมยอดขายเดือนนี้เป็นยังไง?',
        'บริการไหนทำยอดดีที่สุด?',
        'ช่วงเวลาไหนลูกค้าเข้ามากสุด?',
        'ช่องทางไหนมีคนจองเยอะสุด?',
    ];

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
                    bg-gradient-to-br from-blue-500 to-indigo-600 
                    hover:from-blue-600 hover:to-indigo-700
                    text-white shadow-lg shadow-blue-500/30
                    flex items-center justify-center
                    transition-all duration-300 hover:scale-110 active:scale-95
                    ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
                `}
                aria-label="เปิดแชท"
            >
                <MessageCircle size={24} />
                {/* Pulse indicator */}
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-6 right-6 z-50 
                    w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)]
                    bg-white dark:bg-slate-900 
                    rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/40
                    border border-slate-200 dark:border-slate-700
                    flex flex-col overflow-hidden
                    transition-all duration-300 ease-out
                    ${isOpen
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold leading-tight">คิมซอนโฮ</h3>
                            <p className="text-[10px] text-blue-100 leading-tight">ผู้ช่วยวิเคราะห์ธุรกิจ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearChat}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title="ล้างแชท"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title="ย่อ"
                        >
                            <Minimize2 size={14} />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title="ปิด"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center py-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                <Bot size={28} className="text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                                สวัสดีครับ! 👋
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-[280px]">
                                ผมคิมซอนโฮ ผู้ช่วยวิเคราะห์ธุรกิจครับ ถามอะไรเกี่ยวกับร้านได้เลยครับ
                            </p>

                            {/* Suggestion chips */}
                            <div className="w-full space-y-2">
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">ลองถามเหล่านี้ดูครับ:</p>
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(s);
                                            inputRef.current?.focus();
                                        }}
                                        className="w-full text-left text-xs px-3 py-2 rounded-lg
                                            bg-slate-50 dark:bg-slate-800 
                                            hover:bg-blue-50 dark:hover:bg-slate-750
                                            border border-slate-200 dark:border-slate-700
                                            hover:border-blue-300 dark:hover:border-slate-600
                                            text-slate-600 dark:text-slate-400
                                            hover:text-blue-600 dark:hover:text-blue-400
                                            transition-all duration-200"
                                    >
                                        💬 {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user'
                                ? 'bg-blue-100 dark:bg-blue-900/50'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                {msg.role === 'user'
                                    ? <User size={14} className="text-blue-600 dark:text-blue-400" />
                                    : <Sparkles size={12} className="text-white" />
                                }
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.role === 'user'
                                ? 'bg-blue-500 text-white rounded-tr-sm'
                                : 'bg-slate-100 dark:bg-slate-800 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                }`}>
                                {msg.role === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                ) : msg.content ? (
                                    <div className="space-y-0.5">
                                        {renderMarkdown(msg.content)}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 py-1">
                                        <Loader2 size={14} className="animate-spin text-blue-500" />
                                        <span className="text-xs text-slate-400">กำลังคิด...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll down button */}
                {showScrollDown && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 
                            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                            rounded-full p-1.5 shadow-md 
                            hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                        <ChevronDown size={16} className="text-slate-500" />
                    </button>
                )}

                {/* Input Area */}
                <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
                    {!isDataLoaded && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                            <Sparkles size={12} />
                            <span>กรุณาอัปโหลดข้อมูลก่อนเพื่อเริ่มวิเคราะห์ครับ</span>
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isDataLoaded ? 'ถามอะไรก็ได้เกี่ยวกับร้านครับ...' : 'อัปโหลดข้อมูลก่อนนะครับ...'}
                            disabled={!isDataLoaded || isLoading}
                            rows={1}
                            className="flex-1 resize-none text-sm px-3 py-2 rounded-xl
                                bg-slate-50 dark:bg-slate-800 
                                border border-slate-200 dark:border-slate-700
                                focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                                text-slate-900 dark:text-white 
                                placeholder-slate-400 dark:placeholder-slate-500
                                disabled:opacity-50 disabled:cursor-not-allowed
                                outline-none transition-colors
                                max-h-24 overflow-y-auto"
                            style={{ scrollbarWidth: 'thin' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading || !isDataLoaded}
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                bg-gradient-to-r from-blue-500 to-indigo-600 
                                hover:from-blue-600 hover:to-indigo-700
                                text-white shadow-sm
                                disabled:opacity-40 disabled:cursor-not-allowed 
                                disabled:from-slate-300 disabled:to-slate-400
                                transition-all duration-200 active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
