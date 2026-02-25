
import React, { useState } from 'react';
import { Mic, MicOff, Loader2, Sparkles, MessageSquare, Send, Check, X } from 'lucide-react';
import { aiService } from '../../../ai/service';
import { formatCurrency } from '../../../../core/utils';

interface ParsedInvoice {
    customerName: string;
    items: { name: string; quantity: number; price: number }[];
    paymentMethod: string;
}

const VoiceInvoiceButton: React.FC = () => {
    const [mode, setMode] = useState<'idle' | 'input' | 'loading' | 'preview'>('idle');
    const [textInput, setTextInput] = useState('');
    const [parsed, setParsed] = useState<ParsedInvoice | null>(null);
    const [isListening, setIsListening] = useState(false);

    const startVoice = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMode('input'); // fallback to text
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setTextInput(transcript);
            setIsListening(false);
            handleParse(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
            setMode('input');
        };

        recognition.onend = () => setIsListening(false);

        setIsListening(true);
        setMode('input');
        recognition.start();
    };

    const handleParse = async (text: string) => {
        if (!text.trim()) return;
        setMode('loading');
        try {
            const result = await aiService.parseInvoiceCommand(text);
            setParsed(result);
            setMode('preview');
        } catch {
            setMode('input');
        }
    };

    if (mode === 'idle') {
        return (
            <div className="flex gap-2">
                <button
                    onClick={startVoice}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/20"
                >
                    <Mic size={14} />
                    فاتورة بالصوت
                </button>
                <button
                    onClick={() => setMode('input')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    <MessageSquare size={14} />
                    فاتورة بالنص
                </button>
            </div>
        );
    }

    if (mode === 'input') {
        return (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-violet-700 dark:text-violet-400">
                    {isListening ? (
                        <><MicOff size={14} className="animate-pulse text-rose-500" /> جاري الاستماع...</>
                    ) : (
                        <><Sparkles size={14} /> اكتب أمر الفاتورة</>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleParse(textInput)}
                        placeholder='مثال: "3 فلتر زيت بـ 25 ريال للعميل أحمد"'
                        className="flex-1 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 p-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                    <button onClick={() => handleParse(textInput)} className="p-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-all">
                        <Send size={14} />
                    </button>
                    <button onClick={() => { setMode('idle'); setTextInput(''); }} className="p-2.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-lg">
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'loading') {
        return (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-6 text-center">
                <Loader2 size={20} className="animate-spin text-violet-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-violet-600">جاري تحليل الأمر بالذكاء الاصطناعي...</p>
            </div>
        );
    }

    if (mode === 'preview' && parsed) {
        const total = parsed.items.reduce((s, i) => s + i.quantity * i.price, 0);
        return (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-violet-700 dark:text-violet-400">✨ معاينة الفاتورة</span>
                    <div className="flex gap-1.5">
                        <button onClick={() => { setMode('idle'); setParsed(null); setTextInput(''); }} className="p-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg text-gray-500">
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {parsed.customerName && (
                    <p className="text-xs text-gray-600 dark:text-slate-400">👤 العميل: <strong>{parsed.customerName}</strong></p>
                )}

                <div className="space-y-1">
                    {parsed.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs bg-white/70 dark:bg-slate-900/50 rounded-lg p-2">
                            <span className="font-bold">{item.name}</span>
                            <span className="font-mono">{item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-violet-200 dark:border-violet-800/40">
                    <span className="text-xs font-bold text-gray-500">{parsed.paymentMethod === 'cash' ? '💵 نقدي' : '📝 آجل'}</span>
                    <span className="text-sm font-black text-violet-700 dark:text-violet-400">الإجمالي: {formatCurrency(total)}</span>
                </div>

                <p className="text-[9px] text-gray-400 text-center">يمكنك استخدام هذه البيانات لإنشاء فاتورة جديدة</p>
            </div>
        );
    }

    return null;
};

export default VoiceInvoiceButton;
