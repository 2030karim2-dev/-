
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotificationStore, AppNotification } from '../store';
import { useAuthStore } from '../../auth/store';
import {
    Bell,
    Check,
    Trash2,
    X,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
    Clock,
    Volume2,
    VolumeX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useSoundStore } from '../store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Type icons mapping
type NotificationType = 'info' | 'warning' | 'error' | 'success';

const typeConfig: Record<NotificationType, {
    icon: React.ElementType;
    bgColor: string;
    borderColor: string;
    iconColor: string;
    dotColor: string;
}> = {
    info: {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-500',
        dotColor: 'bg-blue-500'
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-500',
        dotColor: 'bg-amber-500'
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200 dark:border-rose-800',
        iconColor: 'text-rose-500',
        dotColor: 'bg-rose-500'
    },
    success: {
        icon: CheckCircle,
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        iconColor: 'text-emerald-500',
        dotColor: 'bg-emerald-500'
    },
};

const NotificationDropdown: React.FC<Props> = ({ isOpen, onClose }) => {
    const { getCompanyNotifications, getCompanyUnreadCount, markAsRead, markAllAsRead, clearAll, deleteNotification } = useNotificationStore();
    const { user } = useAuthStore();
    const companyId = user?.company_id || '';
    const { isSoundEnabled, toggleSound } = useSoundStore();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Company-scoped notifications
    const notifications = useMemo(() => getCompanyNotifications(companyId), [getCompanyNotifications, companyId]);
    const unreadCount = useMemo(() => getCompanyUnreadCount(companyId), [getCompanyUnreadCount, companyId]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Focus trap and initial focus
    useEffect(() => {
        if (isOpen && firstFocusableRef.current) {
            setTimeout(() => firstFocusableRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleNotificationClick = (notif: any) => {
        markAsRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
            onClose();
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead(companyId);
    };

    const handleClearAll = () => {
        if (notifications.length > 0 && window.confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
            clearAll(companyId);
        }
    };

    const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const unreadNotifications = notifications.filter(n => !n.isRead);
    const readNotifications = notifications.filter(n => n.isRead);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={dropdownRef}
                className="fixed md:absolute top-16 md:top-12 left-4 right-4 md:left-auto md:right-0 md:w-[420px] max-h-[80vh] md:max-h-[600px] z-50 
                   bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 
                   border border-gray-100 dark:border-slate-700 overflow-hidden
                   animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-300 ease-out"
                role="dialog"
                aria-label="قائمة الإشعارات"
                aria-modal="true"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-100 dark:border-slate-800 
                        bg-gradient-to-l from-gray-50/80 to-white dark:from-slate-900 dark:to-slate-900
                        backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 
                            flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bell size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                الإشعارات
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                {unreadCount > 0 ? `${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Sound Toggle */}
                        <button
                            ref={firstFocusableRef}
                            onClick={toggleSound}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            title={isSoundEnabled ? 'تعطيل صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
                            aria-label={isSoundEnabled ? 'تعطيل صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
                        >
                            {isSoundEnabled ? (
                                <Volume2 size={16} className="text-emerald-500" />
                            ) : (
                                <VolumeX size={16} />
                            )}
                        </button>

                        {/* Mark all as read */}
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                           transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                title="تحديد الكل كمقروء"
                                aria-label="تحديد الكل كمقروء"
                            >
                                <Check size={16} />
                            </button>
                        )}

                        {/* Clear all */}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20
                           transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                                title="حذف جميع الإشعارات"
                                aria-label="حذف جميع الإشعارات"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                            aria-label="إغلاق"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[calc(80vh-80px)] md:max-h-[480px] custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 
                              dark:from-slate-800 dark:to-slate-900 
                              flex items-center justify-center mb-4 shadow-inner">
                                <Bell size={32} className="text-gray-300 dark:text-slate-600" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">
                                لا توجد إشعارات
                            </h4>
                            <p className="text-xs text-gray-400 dark:text-slate-500 max-w-[200px]">
                                ستظهر هنا الإشعارات الجديدة عند وصولها
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {/* Unread Notifications Section */}
                            {unreadNotifications.length > 0 && (
                                <div className="bg-blue-50/30 dark:bg-blue-900/5">
                                    <div className="px-4 py-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        إشعارات جديدة ({unreadNotifications.length})
                                    </div>
                                    {unreadNotifications.map((notif) => (
                                        <NotificationItem
                                            key={notif.id}
                                            notif={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDeleteNotification(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Read Notifications Section */}
                            {readNotifications.length > 0 && (
                                <div>
                                    {unreadNotifications.length > 0 && (
                                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                            مقروءة سابقاً
                                        </div>
                                    )}
                                    {readNotifications.map((notif) => (
                                        <NotificationItem
                                            key={notif.id}
                                            notif={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDeleteNotification(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="sticky bottom-0 px-4 py-3 border-t border-gray-100 dark:border-slate-800
                          bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-xl">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-slate-400">
                                {notifications.length} إشعار
                            </span>
                            <button
                                onClick={() => navigate('/settings')}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300
                           font-medium flex items-center gap-1 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-lg px-2 py-1"
                            >
                                إعدادات الإشعارات
                                <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// Individual Notification Item Component
interface NotificationItemProps {
    notif: AppNotification;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onClick, onDelete }) => {
    const config = typeConfig[notif.type as NotificationType] || typeConfig.info;
    const Icon = config.icon;

    return (
        <div
            onClick={onClick}
            className={`
        group relative p-4 md:p-5 cursor-pointer transition-all duration-300 ease-out
        hover:bg-gray-50 dark:hover:bg-slate-800/50
        ${!notif.isRead ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-900/30'}
      `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            aria-label={`${notif.title}: ${notif.message}`}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${config.bgColor} border ${config.borderColor}
          transition-transform duration-200 group-hover:scale-110
        `}>
                    <Icon size={18} className={config.iconColor} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={`
              text-xs font-bold leading-tight
              ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-400'}
            `}>
                            {notif.title}
                        </h4>

                        {/* Delete button - visible on hover */}
                        <button
                            onClick={onDelete}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 
                         hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20
                         transition-all duration-200 focus:opacity-100 focus:outline-none"
                            aria-label="حذف الإشعار"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    <p className={`
            text-[11px] mt-1 leading-relaxed line-clamp-2
            ${!notif.isRead ? 'text-gray-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}
          `}>
                        {notif.message}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 dark:text-slate-500">
                        <Clock size={10} />
                        <span>
                            {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: ar })}
                        </span>
                    </div>
                </div>

                {/* Unread indicator */}
                {!notif.isRead && (
                    <div className={`
            flex-shrink-0 w-2.5 h-2.5 rounded-full ${config.dotColor}
            animate-pulse shadow-sm shadow-current
          `} />
                )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-l from-blue-500/0 via-blue-500/0 to-blue-500/5 
                      dark:from-blue-500/0 dark:via-blue-500/0 dark:to-blue-500/10
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </div>
    );
};

export default NotificationDropdown;
