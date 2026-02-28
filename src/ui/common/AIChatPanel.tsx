
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Trash2, Loader2, Bot, User, Sparkles, Wrench, Mic, MicOff, Volume2, VolumeX, Brain, Copy, Share2, Command } from 'lucide-react';
import { useAIChat } from '../../features/ai/useAIChat';
import { speakText, stopSpeaking } from '../../features/ai/chatService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const QUICK_PROMPTS = [
    { label: '📊 ملخص مالي', prompt: 'أعطني ملخص سريع عن الوضع المالي', icon: '📊' },
    { label: '📦 حالة المخزون', prompt: 'كيف حال المخزون؟ أعطني أرقام', icon: '📦' },
    { label: '👥 أكبر مديون', prompt: 'من أكثر عميل مديون وكم مبلغه؟', icon: '👥' },
    { label: '💡 نصيحة اليوم', prompt: 'أعطني نصيحة عملية لتحسين أداء المحل اليوم', icon: '💡' },
    { label: '🔧 قطعة الموسم', prompt: 'ما القطع الأكثر طلباً هذا الموسم؟', icon: '🔧' },
    { label: '🌙 تغيير الثيم', prompt: 'غير الثيم', icon: '🌙' },
];

const SLASH_COMMANDS = [
    { command: '/ملخص', label: 'ملخص مالي سريع', prompt: 'أعطني ملخص مالي مع أرقام' },
    { command: '/مخزون', label: 'حالة المخزون', prompt: 'أعطني تقرير مختصر عن المخزون مع المنتجات المنخفضة' },
    { command: '/ربح', label: 'تحليل الأرباح', prompt: 'ما صافي الربح والهامش الحالي؟' },
    { command: '/منتج', label: 'البحث وتأكيد منتج', prompt: 'ابحث عن المنتج التالي' },
    { command: '/مصروف', label: 'إنشاء مصروف جديد', prompt: 'أضف مصروف جديد بقيمة' },
    { command: '/سند_دفع', label: 'إنشاء سند صرف', prompt: 'اعمل سند دفع بقيمة' },
    { command: '/سند_قبض', label: 'إنشاء سند استلام', prompt: 'اعمل سند استلام بقيمة' },
    { command: '/عميل', label: 'إضافة عميل', prompt: 'أريد إضافة عميل جديد' },
    { command: '/مورد', label: 'إضافة مورد', prompt: 'أريد إضافة مورد جديد' },
];

const AIChatPanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const { messages, isLoading, error, sendMessage, clearChat, executePendingAction, cancelPendingAction } = useAIChat({ enabled: isOpen });
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashFilter, setSlashFilter] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Auto-speak last assistant message
    useEffect(() => {
        if (!autoSpeak || messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant' && !isLoading) {
            setIsSpeaking(true);
            speakText(lastMsg.content).then(() => setIsSpeaking(false));
        }
    }, [messages, isLoading, autoSpeak]);

    const handleSend = useCallback(() => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = '44px';
    }, [input, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);
        e.target.style.height = '44px';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        // Slash command detection
        if (val.startsWith('/')) {
            setShowSlashMenu(true);
            setSlashFilter(val.slice(1));
        } else {
            setShowSlashMenu(false);
        }
    };

    const handleSlashSelect = (cmd: typeof SLASH_COMMANDS[0]) => {
        setInput('');
        setShowSlashMenu(false);
        sendMessage(cmd.prompt);
    };

    const filteredSlashCmds = SLASH_COMMANDS.filter(c => c.command.includes(slashFilter) || c.label.includes(slashFilter));

    // Chat export
    const exportChat = (mode: 'copy' | 'whatsapp') => {
        const text = messages.map(m => `${m.role === 'user' ? '👤' : '🤖'} ${m.content}`).join('\n\n');
        const fullText = `📋 محادثة مساعد الجعفري الذكي\n${new Date().toLocaleDateString('ar-SA')}\n━━━━━━━━━━\n${text}`;
        if (mode === 'copy') {
            navigator.clipboard.writeText(fullText);
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
        }
    };

    // Voice Input (Speech-to-Text)
    const toggleListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('المتصفح لا يدعم الإدخال الصوتي. استخدم Chrome أو Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setInput(transcript);

            // Auto-send on final result
            if (event.results[0].isFinal) {
                setTimeout(() => {
                    if (transcript.trim()) {
                        sendMessage(transcript.trim());
                        setInput('');
                    }
                    setIsListening(false);
                }, 300);
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
        setIsListening(true);
    }, [isListening, sendMessage]);

    // Speak a specific message
    const handleSpeak = async (text: string) => {
        if (isSpeaking) {
            stopSpeaking();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            await speakText(text);
            setIsSpeaking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-end pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full sm:w-[440px] h-[90vh] sm:h-[700px] sm:mr-4 sm:mb-4 bg-white dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-slate-800 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-4 flex items-center justify-between text-white">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Brain size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm tracking-tight">مساعد الجعفري الذكي</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">خبير قطع غيار • محاسب • مستشار</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-1">
                        {/* Export buttons */}
                        {messages.length > 0 && (
                            <>
                                <button onClick={() => exportChat('copy')} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="نسخ المحادثة">
                                    <Copy size={14} />
                                </button>
                                <button onClick={() => exportChat('whatsapp')} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="مشاركة عبر واتساب">
                                    <Share2 size={14} />
                                </button>
                            </>
                        )}
                        {/* Auto-speak toggle */}
                        <button
                            onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); } }}
                            className={`p-2 rounded-xl transition-colors ${autoSpeak ? 'bg-white/20 text-emerald-300' : 'hover:bg-white/10'}`}
                            title={autoSpeak ? 'إيقاف القراءة التلقائية' : 'تفعيل القراءة التلقائية'}
                        >
                            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                        <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="مسح المحادثة">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center space-y-4 pt-6">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 flex items-center justify-center relative">
                                <Sparkles size={32} className="text-blue-500" />
                                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-lg">🎙️</span>
                            </div>
                            <div>
                                <h4 className="font-black text-gray-800 dark:text-slate-100 text-lg">مرحباً! أنا مساعدك الذكي 🔧</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    خبير في قطع غيار السيارات والمحاسبة — اكتب أو تكلم بالصوت!
                                </p>
                            </div>

                            {/* Voice hint */}
                            <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-2xl p-3 text-xs">
                                <p className="font-bold text-violet-700 dark:text-violet-400 mb-1">🎙️ جديد: المساعد الصوتي</p>
                                <p className="text-gray-500 dark:text-slate-400">اضغط زر المايك وتكلم — المساعد يسمعك ويرد بالصوت!</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                {QUICK_PROMPTS.map((qp, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(qp.prompt)}
                                        className="text-xs font-bold p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:border-blue-800 transition-all text-right"
                                    >
                                        {qp.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => sendMessage("أضف مصروف 500 ريال لكهرباء المحل")}
                                    className="text-xs font-bold p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/20 dark:hover:border-rose-800 transition-all text-right"
                                >
                                    💸 إنشاء مصروف
                                </button>
                                <button
                                    onClick={() => sendMessage("كم سعر فلتر زيت تويوتا كامري 2020؟")}
                                    className="text-xs font-bold p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 hover:border-teal-200 dark:hover:bg-teal-950/20 dark:hover:border-teal-800 transition-all text-right"
                                >
                                    🔧 خبير قطع
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                                }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed group relative ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-md'
                                : 'bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-slate-200 rounded-tl-md border border-gray-200/50 dark:border-slate-800'
                                }`}>
                                <p className="whitespace-pre-wrap text-[13px] font-medium">{msg.content}</p>
                                <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                                    <p className={`text-[9px] font-bold ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'}`}>
                                        {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => handleSpeak(msg.content)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all"
                                            title="تشغيل الصوت"
                                        >
                                            <Volume2 size={12} />
                                        </button>
                                    )}
                                </div>

                                {msg.pendingActions && msg.pendingActions.length > 0 && (
                                    <div className="mt-3 space-y-2 border-t border-gray-200/50 dark:border-slate-700/50 pt-3">
                                        {msg.pendingActions.map((action, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-800/80 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                                                <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                                                    <Sparkles size={12} />
                                                    هل تريد تنفيذ: {action.confirmation || action.action}؟
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => executePendingAction(msg.id, idx)}
                                                        disabled={isLoading}
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        ✅ تأكيد وتنفيذ
                                                    </button>
                                                    <button
                                                        onClick={() => cancelPendingAction(msg.id, idx)}
                                                        disabled={isLoading}
                                                        className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 disabled:opacity-50 text-rose-600 dark:text-rose-400 text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        ❌ إلغاء
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center flex-shrink-0">
                                <Bot size={14} />
                            </div>
                            <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl rounded-tl-md p-3 border border-gray-200/50 dark:border-slate-800">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-3 text-xs text-rose-600 dark:text-rose-400 font-bold">
                            ❌ {error}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    {/* Voice listening indicator */}
                    {isListening && (
                        <div className="mb-2 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-3 flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
                                    <Mic size={18} className="text-white" />
                                </div>
                                <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-rose-700 dark:text-rose-400">🎙️ جاري الاستماع...</p>
                                <p className="text-[10px] text-rose-600/60 dark:text-rose-400/50">{input || 'تكلم الآن — سأفهم العربي!'}</p>
                            </div>
                            <button onClick={toggleListening} className="p-2 bg-rose-200 dark:bg-rose-800/40 rounded-xl text-rose-600">
                                <MicOff size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        {/* Mic Button */}
                        <button
                            onClick={toggleListening}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg flex-shrink-0 ${isListening
                                ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 shadow-none'
                                }`}
                            title={isListening ? 'إيقاف' : 'تكلم بالصوت'}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                        {/* Slash Commands Dropdown */}
                        {showSlashMenu && filteredSlashCmds.length > 0 && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-10 max-h-[200px] overflow-y-auto">
                                <p className="text-[9px] font-black text-gray-400 uppercase px-3 pt-2 pb-1">⚡ أوامر سريعة</p>
                                {filteredSlashCmds.map((cmd, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSlashSelect(cmd)}
                                        className="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors flex items-center gap-2"
                                    >
                                        <Command size={10} className="text-violet-500 flex-shrink-0" />
                                        <span className="font-black text-violet-600 dark:text-violet-400">{cmd.command}</span>
                                        <span className="text-gray-500 dark:text-slate-400 font-medium">{cmd.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Text Input */}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder={isListening ? 'أتكلم...' : 'اكتب / للأوامر السريعة أو تكلم 🎙️'}
                            className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:text-white placeholder:text-gray-400"
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none flex-shrink-0"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <p className="text-[8px] text-gray-400 dark:text-slate-600 font-bold">
                            مساعد الجعفري — ذكاء اصطناعي + صوت
                        </p>
                        {isSpeaking && (
                            <button onClick={() => { stopSpeaking(); setIsSpeaking(false); }} className="text-[9px] font-bold text-blue-500 flex items-center gap-1">
                                <VolumeX size={10} /> إيقاف الصوت
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatPanel;
