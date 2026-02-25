
import React, { useState } from 'react';
import { Bot, Mic } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

const AIChatButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Ctrl+K keyboard shortcut
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 left-6 z-[9998] w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
                    title="المساعد الذكي (Ctrl+K)"
                >
                    <Bot size={22} className="group-hover:hidden transition-all" />
                    <Mic size={22} className="hidden group-hover:block transition-all" />
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping opacity-60" />
                    {/* Voice badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[8px] shadow-lg">
                        🎙️
                    </span>
                    {/* Ctrl+K hint */}
                    <span className="absolute -bottom-1 -left-1 px-1 py-0.5 bg-white/90 dark:bg-slate-800 text-[7px] font-black text-gray-600 dark:text-slate-300 rounded shadow text-center leading-none">
                        Ctrl+K
                    </span>
                </button>
            )}

            {/* Chat Panel */}
            <AIChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default AIChatButton;
