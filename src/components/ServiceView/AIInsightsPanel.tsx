'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import {
    AnalysisType,
    prepareMoMData,
    prepareYoYData,
    prepareQuarterlyData,
    prepareMonthlyData,
    getAnalysisPeriodLabel,
    getAvailableMomOptions,
    getAvailableYoyOptions,
    getAvailableQuarterOptions,
    getAvailableMonthlyOptions,
} from '@/utils/aiDataPreparer';
import {
    Sparkles,
    X,
    TrendingUp,
    CalendarRange,
    BarChart3,
    Calendar,
    ChevronDown,
    Loader2,
    AlertCircle,
    Minimize2,
    Maximize2,
    Copy,
    Check,
} from 'lucide-react';

interface AnalysisOption {
    type: AnalysisType;
    label: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    color: string;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
    {
        type: 'mom',
        label: 'MoM Analysis',
        description: 'เปรียบเทียบเดือนนี้ vs เดือนที่แล้ว',
        icon: TrendingUp,
        gradient: 'from-emerald-500 to-teal-600',
        color: 'text-emerald-400',
    },
    {
        type: 'yoy',
        label: 'YoY Analysis',
        description: 'เทียบเดือนเดียวกันกับปีที่แล้ว',
        icon: CalendarRange,
        gradient: 'from-blue-500 to-indigo-600',
        color: 'text-blue-400',
    },
    {
        type: 'quarterly',
        label: 'Quarterly Trend',
        description: 'แนวโน้ม 3 เดือนย้อนหลัง',
        icon: BarChart3,
        gradient: 'from-violet-500 to-purple-600',
        color: 'text-violet-400',
    },
    {
        type: 'monthly',
        label: 'Monthly Deep Dive',
        description: 'วิเคราะห์เจาะลึกรายเดือน',
        icon: Calendar,
        gradient: 'from-amber-500 to-orange-600',
        color: 'text-amber-400',
    },
];

export default function AIInsightsPanel() {
    const { serviceData } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisOption | null>(null);
    const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [copied, setCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when streaming
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [streamedText]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const prepareData = useCallback(
        (type: AnalysisType, periodKey?: string): string | null => {
            switch (type) {
                case 'mom':
                    return prepareMoMData(serviceData, periodKey);
                case 'yoy':
                    return prepareYoYData(serviceData, periodKey);
                case 'quarterly':
                    return prepareQuarterlyData(serviceData, periodKey);
                case 'monthly':
                    return prepareMonthlyData(serviceData, periodKey);
            }
        },
        [serviceData]
    );

    const openInsightsPanel = (option: AnalysisOption) => {
        setSelectedAnalysis(option);

        // Auto select first option based on type
        let initialKey = undefined;
        switch (option.type) {
            case 'mom':
                initialKey = getAvailableMomOptions(serviceData)[0]?.key;
                break;
            case 'yoy':
                initialKey = getAvailableYoyOptions(serviceData)[0]?.key;
                break;
            case 'quarterly':
                initialKey = getAvailableQuarterOptions(serviceData)[0]?.key;
                break;
            case 'monthly':
                initialKey = getAvailableMonthlyOptions(serviceData)[0]?.key;
                break;
        }
        setSelectedPeriodKey(initialKey);

        setIsDropdownOpen(false);
        setIsOpen(true);
        setIsMinimized(false);
        setStreamedText('');
        setError(null);
        setHasAnalyzed(false);
    };

    const runAnalysis = async () => {
        if (!selectedAnalysis) return;

        setHasAnalyzed(true);
        setStreamedText('');
        setError(null);
        setIsLoading(true);

        const dataPayload = prepareData(selectedAnalysis.type, selectedPeriodKey);
        if (!dataPayload) {
            setError(
                selectedAnalysis.type === 'yoy'
                    ? 'ไม่มีข้อมูลปีที่แล้วสำหรับเปรียบเทียบ'
                    : 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์นี้'
            );
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysisType: selectedAnalysis.type,
                    dataPayload,
                    messages: [],
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response stream available');
            }

            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setStreamedText(fullText);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(streamedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setIsOpen(false);
        setStreamedText('');
        setError(null);
        setSelectedAnalysis(null);
        setSelectedPeriodKey(undefined);
        setHasAnalyzed(false);
    };

    // Simple markdown-like rendering  
    const renderContent = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, i) => {
            // Headers
            if (line.startsWith('### ')) {
                return <h4 key={i} className="text-base font-bold text-slate-800 dark:text-white mt-4 mb-2">{renderInline(line.slice(4))}</h4>;
            }
            if (line.startsWith('## ')) {
                return <h3 key={i} className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">{renderInline(line.slice(3))}</h3>;
            }
            if (line.startsWith('# ')) {
                return <h2 key={i} className="text-xl font-bold text-slate-800 dark:text-white mt-4 mb-2">{renderInline(line.slice(2))}</h2>;
            }
            // Bullet points
            if (line.match(/^[\s]*[-*•]\s/)) {
                const indent = line.search(/[^\s]/);
                return (
                    <div key={i} className="flex items-start gap-2 my-1" style={{ paddingLeft: `${Math.max(0, indent) * 8}px` }}>
                        <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{renderInline(line.replace(/^[\s]*[-*•]\s/, ''))}</span>
                    </div>
                );
            }
            // Numbered items
            if (line.match(/^\d+\.\s/)) {
                const num = line.match(/^(\d+)\./)?.[1];
                return (
                    <div key={i} className="flex items-start gap-2 my-1">
                        <span className="text-blue-500 dark:text-blue-400 font-semibold mt-0.5 shrink-0 min-w-[20px]">{num}.</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
                    </div>
                );
            }
            // Horizontal rule
            if (line.match(/^[-=]{3,}$/)) {
                return <hr key={i} className="border-slate-700 my-3" />;
            }
            // Empty line
            if (line.trim() === '') {
                return <div key={i} className="h-2" />;
            }
            // Normal paragraph
            return <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed my-1">{renderInline(line)}</p>;
        });
    };

    // Render inline formatting (bold, inline code)
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-slate-900 dark:text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-amber-600 dark:text-amber-300 text-sm font-mono">{part.slice(1, -1)}</code>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    // Extract key numbers for highlight cards
    const extractHighlights = (text: string) => {
        const highlights: { label: string; value: string; positive: boolean }[] = [];

        // Match patterns like "+15%" or "-8.5%" or "+฿12,345"
        const patterns = [
            /รายได้.*?(เพิ่มขึ้น|ลดลง|โต|เติบโต|ลด).*?(\d[\d,.]*%)/gi,
            /(เพิ่มขึ้น|โต|เติบโต).*?(\d[\d,.]*%)/gi,
            /(ลดลง|ลด).*?(\d[\d,.]*%)/gi,
        ];

        // Look for percentage changes in the text
        const pctMatches = text.matchAll(/([+-]?\d[\d,.]*%)/g);
        for (const match of pctMatches) {
            const context = text.substring(Math.max(0, match.index! - 40), match.index! + match[0].length + 5);
            const isPositive = !context.includes('ลดลง') && !context.includes('-') || context.includes('เพิ่ม') || context.includes('โต');

            // Get a short label from context
            const labelMatch = context.match(/(รายได้|ยอด|จำนวน|ลูกค้า|บริการ|สินค้า|รายการ)/);
            if (labelMatch && highlights.length < 3) {
                highlights.push({
                    label: labelMatch[1],
                    value: match[0],
                    positive: isPositive && !match[0].startsWith('-'),
                });
            }
        }

        return highlights;
    };

    return (
        <>
            {/* Magic Insights Trigger Button */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl 
            bg-gradient-to-r from-violet-600/80 to-blue-600/80 
            hover:from-violet-500 hover:to-blue-500
            border border-violet-400/30 hover:border-violet-400/60
            shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40
            transition-all duration-300 transform hover:scale-[1.02]"
                >
                    <Sparkles className="w-4 h-4 text-violet-200 group-hover:animate-pulse" />
                    <span className="text-sm font-semibold text-white">Magic Insights</span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-violet-200 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                            }`}
                    />
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-600/50 shadow-2xl shadow-black/10 dark:shadow-black/40 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">เลือกรูปแบบการวิเคราะห์</p>
                        </div>
                        {ANALYSIS_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const periodLabel = getAnalysisPeriodLabel(option.type, serviceData);
                            return (
                                <button
                                    key={option.type}
                                    onClick={() => openInsightsPanel(option)}
                                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group/item"
                                >
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${option.gradient} shadow-lg shrink-0 mt-0.5`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-300 transition-colors">
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{option.description}</p>
                                        <p className="text-xs text-slate-500 mt-1 truncate">📅 {periodLabel}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating AI Panel */}
            {isOpen && selectedAnalysis && (
                <div
                    className={`fixed z-[100] transition-all duration-500 ease-out ${isMinimized
                        ? 'bottom-6 right-6 w-72'
                        : 'top-4 right-4 bottom-4 w-[520px]'
                        }`}
                >
                    <div
                        className={`h-full flex flex-col rounded-2xl overflow-hidden 
              bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl 
              border border-slate-200 dark:border-slate-600/40
              shadow-2xl shadow-black/10 dark:shadow-black/50
              ${isMinimized ? '' : 'animate-in slide-in-from-right duration-400'}`}
                    >
                        {/* Panel Header */}
                        <div className={`shrink-0 bg-gradient-to-r ${selectedAnalysis.gradient} px-5 py-4`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{selectedAnalysis.label}</h3>
                                        {!isMinimized && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <select
                                                    value={selectedPeriodKey || ''}
                                                    onChange={(e) => {
                                                        setSelectedPeriodKey(e.target.value);
                                                        setHasAnalyzed(false);
                                                    }}
                                                    disabled={isLoading}
                                                    className="bg-white/10 text-xs text-white border border-white/20 rounded-md px-2 py-1 outline-none focus:border-white focus:bg-white/20 transition-colors disabled:opacity-50"
                                                >
                                                    {selectedAnalysis.type === 'mom' && getAvailableMomOptions(serviceData).map(o => (
                                                        <option key={o.key} value={o.key}>{o.label}</option>
                                                    ))}
                                                    {selectedAnalysis.type === 'yoy' && getAvailableYoyOptions(serviceData).map(o => (
                                                        <option key={o.key} value={o.key}>{o.label}</option>
                                                    ))}
                                                    {selectedAnalysis.type === 'quarterly' && getAvailableQuarterOptions(serviceData).map(o => (
                                                        <option key={o.key} value={o.key}>{o.label}</option>
                                                    ))}
                                                    {selectedAnalysis.type === 'monthly' && getAvailableMonthlyOptions(serviceData).map(o => (
                                                        <option key={o.key} value={o.key}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isMinimized && streamedText && (
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                            title="Copy"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-white" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-white/70" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        {isMinimized ? (
                                            <Maximize2 className="w-4 h-4 text-white/70" />
                                        ) : (
                                            <Minimize2 className="w-4 h-4 text-white/70" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white/70" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Minimized summary */}
                        {isMinimized && (
                            <div className="px-4 py-3">
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                    {isLoading ? 'กำลังวิเคราะห์...' : streamedText.slice(0, 120) + '...'}
                                </p>
                            </div>
                        )}

                        {/* Panel Content */}
                        {!isMinimized && (
                            <>
                                {/* Ready to start state */}
                                {!hasAnalyzed && !isLoading && !error && (
                                    <div className="flex flex-col items-center justify-center py-16 px-6 gap-6 text-center h-full">
                                        <div className={`p-4 mx-auto rounded-2xl bg-gradient-to-br ${selectedAnalysis.gradient} shadow-lg shrink-0 mt-0.5`}>
                                            {React.createElement(selectedAnalysis.icon, { className: 'w-10 h-10 text-white' })}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">พร้อมวิเคราะห์ข้อมูล</h2>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">เลือกช่วงเวลาที่ต้องการเปรียบเทียบจากเมนูด้านบน แล้วกดเริ่มเพื่อเจาะลึกข้อมูล</p>
                                        </div>
                                        <button
                                            onClick={runAnalysis}
                                            className={`mt-2 group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${selectedAnalysis.gradient} shadow-lg transition-transform hover:scale-105 active:scale-95`}
                                        >
                                            <Sparkles className="w-4 h-4 text-white" />
                                            <span className="text-sm font-semibold text-white">เริ่มวิเคราะห์เลย</span>
                                            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                                        </button>
                                    </div>
                                )}

                                {/* Highlight Cards */}
                                {hasAnalyzed && !isLoading && streamedText && (
                                    (() => {
                                        const highlights = extractHighlights(streamedText);
                                        if (highlights.length === 0) return null;
                                        return (
                                            <div className="shrink-0 px-5 pt-4 pb-2 grid grid-cols-3 gap-2">
                                                {highlights.map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className={`rounded-lg px-3 py-2.5 text-center border ${h.positive
                                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                                            : 'bg-red-500/10 border-red-500/30'
                                                            }`}
                                                    >
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{h.label}</p>
                                                        <p className={`text-base font-bold mt-0.5 ${h.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {h.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()
                                )}

                                {/* Streaming Content */}
                                <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4 scroll-smooth custom-scrollbar">
                                    {/* Loading state */}
                                    {isLoading && !streamedText && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 blur-xl opacity-40 animate-pulse" />
                                                <div className="relative p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                    <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-300">AI กำลังวิเคราะห์ข้อมูล...</p>
                                                <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่</p>
                                            </div>
                                            {/* Skeleton loading */}
                                            <div className="w-full space-y-3 mt-4">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="space-y-2 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                                                        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded-full" style={{ width: `${85 - i * 15}%` }} />
                                                        <div className="h-3 bg-slate-100 dark:bg-slate-700/30 rounded-full" style={{ width: `${70 - i * 10}%` }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Error state */}
                                    {error && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30">
                                                <AlertCircle className="w-8 h-8 text-red-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-red-300">{error}</p>
                                                <p className="text-xs text-slate-500 mt-2">ลองเลือกรูปแบบการวิเคราะห์อื่น</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Streamed text */}
                                    {streamedText && (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            {renderContent(streamedText)}
                                            {isLoading && (
                                                <span className="inline-block w-2 h-4 bg-violet-400 rounded-sm animate-pulse ml-0.5" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {(!isLoading && hasAnalyzed && streamedText) && (
                                    <div className="shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-slate-500">
                                                Powered by Gemini AI • วิเคราะห์จากข้อมูลจริงเท่านั้น
                                            </p>
                                            <div className="flex gap-1.5">
                                                {ANALYSIS_OPTIONS.filter(o => o.type !== selectedAnalysis.type).map(option => {
                                                    const Icon = option.icon;
                                                    return (
                                                        <button
                                                            key={option.type}
                                                            onClick={() => openInsightsPanel(option)}
                                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg 
                                bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 
                                border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500/50
                                transition-all text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white`}
                                                            title={option.description}
                                                        >
                                                            <Icon className="w-3 h-3" />
                                                            <span>{option.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Custom scrollbar and animation styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.4);
                }
                @keyframes ai-slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-in {
                    animation: ai-slide-in 0.4s ease-out;
                }
                .slide-in-from-right {
                    animation: ai-slide-in 0.4s ease-out;
                }
                @keyframes ai-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes ai-slide-top {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fade-in {
                    animation: ai-fade-in 0.2s ease-out;
                }
                .slide-in-from-top-2 {
                    animation: ai-slide-top 0.2s ease-out;
                }
            `}} />
        </>
    );
}
