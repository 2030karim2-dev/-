
import React from 'react';
import { useNotificationStore } from '../store';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Props {
    onClose: () => void;
}

const NotificationDropdown: React.FC<Props> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const navigate = useNavigate();

  const handleClick = (notif: any) => {
      markAsRead(notif.id);
      if (notif.link) {
          navigate(notif.link);
          onClose();
      }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
            <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <Bell size={14} className="text-blue-500" /> الإشعارات
            </h3>
            <div className="flex gap-1">
                <button onClick={markAllAsRead} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="تحديد الكل كمقروء"><Check size={14} /></button>
                <button onClick={clearAll} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="مسح الكل"><Trash2 size={14} /></button>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
            </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                    <p className="text-[10px] font-bold">لا توجد إشعارات جديدة</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((notif) => (
                        <div 
                            key={notif.id}
                            onClick={() => handleClick(notif)}
                            className={`p-4 border-b border-gray-50 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors relative ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        >
                            {!notif.isRead && <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>}
                            <h4 className="text-[10px] font-black text-gray-800 dark:text-slate-200 mb-1">{notif.title}</h4>
                            <p className="text-[9px] text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">{notif.message}</p>
                            <span className="text-[8px] text-gray-300 dark:text-slate-600 mt-2 block font-mono">
                                {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: ar })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default NotificationDropdown;
