
import React, { useState, useEffect } from 'react';
import { Terminal, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useFeedbackStore } from '../../features/feedback/store';

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<{ msg: string, type: 'success' | 'error' | 'info', time: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toasts } = useFeedbackStore();

  useEffect(() => {
    if (toasts.length > 0) {
      const lastToast = toasts[toasts.length - 1];
      setLogs(prev => [...prev, {
        msg: `Button Action: ${lastToast.message}`,
        type: (lastToast.type === 'success' ? 'success' : 'error') as 'success' | 'error' | 'info',
        time: new Date().toLocaleTimeString()
      }].slice(-10));
    }
  }, [toasts]);

  if (process.env.NODE_ENV === 'production' && !window.location.href.includes('debug')) return null;

  return (
    <div className={`fixed bottom-20 left-4 z-[999] transition-all duration-500 ${isOpen ? 'w-80' : 'w-12'}`}>
      {isOpen ? (
        <div className="bg-slate-900 border-2 border-blue-500/30 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-96">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-400">
              <Terminal size={16} />
              <span className="text-[10px] font-black uppercase">Button Auditor v1.0</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xs">إغلاق</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="text-[9px] font-mono border-b border-slate-800 pb-2 flex gap-2">
                <span className="text-slate-500">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                  {log.type === 'success' ? '✔' : '✘'} {log.msg}
                </span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-slate-600 text-center text-[10px] py-20">بانتظار تفاعل مع الأزرار...</p>}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-slate-900 border-2 border-blue-500 text-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse"
        >
          <Activity size={20} />
        </button>
      )}
    </div>
  );
};
