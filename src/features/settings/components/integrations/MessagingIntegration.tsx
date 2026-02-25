// ============================================
// MessagingIntegration - WhatsApp & Telegram Settings UI
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Save, TestTube, CheckCircle, XCircle, Loader2, Send, MessageCircle, Radio } from 'lucide-react';
import Card from '@/ui/base/Card';
import Button from '@/ui/base/Button';
import { useFeedbackStore } from '@/features/feedback/store';
import { messagingApi, MessagingConfig, DEFAULT_MESSAGING_CONFIG } from '@/features/notifications/messagingApi';
import { messagingService } from '@/features/notifications/messagingService';

interface Props {
    companyId: string;
}

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const eventToggles = [
    { id: 'notify_on_sale', label: 'المبيعات', desc: 'إشعار عند إنشاء فاتورة بيع', emoji: '🧾' },
    { id: 'notify_on_purchase', label: 'المشتريات', desc: 'إشعار عند إنشاء فاتورة شراء', emoji: '📦' },
    { id: 'notify_on_bond', label: 'السندات', desc: 'إشعار عند إنشاء سند قبض أو صرف', emoji: '💵' },
    { id: 'notify_on_expense', label: 'المصروفات', desc: 'إشعار عند تسجيل مصروف', emoji: '🏷️' },
    { id: 'notify_on_stock_transfer', label: 'تحويلات المخزون', desc: 'إشعار عند تحويل بين المستودعات', emoji: '🔄' },
    { id: 'notify_on_low_stock', label: 'تنبيه المخزون', desc: 'إشعار عند وصول صنف للحد الأدنى', emoji: '⚠️' },
] as const;

const MessagingIntegration: React.FC<Props> = ({ companyId }) => {
    const { showToast } = useFeedbackStore();
    const [config, setConfig] = useState<MessagingConfig>({ company_id: companyId, ...DEFAULT_MESSAGING_CONFIG });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // Load config on mount
    useEffect(() => {
        (async () => {
            try {
                const data = await messagingApi.getConfig(companyId);
                if (data) {
                    setConfig(data);
                } else {
                    setConfig({ company_id: companyId, ...DEFAULT_MESSAGING_CONFIG });
                }
            } catch {
                console.error('[MessagingIntegration] Load config error');
            } finally {
                setLoading(false);
            }
        })();
    }, [companyId]);

    const handleUpdate = useCallback((updates: Partial<MessagingConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await messagingApi.saveConfig(config);
            if (error) {
                showToast('فشل حفظ الإعدادات', 'error');
            } else {
                showToast('تم حفظ إعدادات الرسائل بنجاح ✅', 'success');
            }
        } catch {
            showToast('حدث خطأ غير متوقع', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        // Save first
        setSaving(true);
        const { error } = await messagingApi.saveConfig(config);
        setSaving(false);
        if (error) {
            showToast('يجب حفظ الإعدادات أولاً', 'error');
            return;
        }

        setTesting(true);
        try {
            const result = await messagingService.testConnection(companyId);
            if (result.success && result.results?.some(r => r.success)) {
                showToast('تم إرسال رسالة الاختبار بنجاح! ✅', 'success');
            } else {
                const failedChannels = result.results?.filter(r => !r.success).map(r => `${r.channel}: ${r.error}`).join(', ');
                showToast(`فشل الاختبار: ${failedChannels || 'لا توجد قنوات مفعلة'}`, 'error');
            }
        } catch {
            showToast('فشل اختبار الاتصال', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Send className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            الرسائل التلقائية
                        </h2>
                        <p className="text-sm text-slate-500">
                            إرسال تلقائي للمعاملات عبر واتساب وتليجرام
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleTest}
                        isLoading={testing}
                        variant="outline"
                        className="gap-2"
                        leftIcon={<TestTube size={16} />}
                    >
                        اختبار
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        className="gap-2"
                        leftIcon={<Save size={16} />}
                    >
                        حفظ
                    </Button>
                </div>
            </div>

            {/* Telegram Card */}
            <Card className="overflow-hidden border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="bg-gradient-to-l from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 p-4 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0088cc] rounded-xl flex items-center justify-center text-white shadow-md">
                                <TelegramIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Telegram</h3>
                                <p className="text-xs text-slate-500">إرسال الإشعارات إلى مجموعة أو قناة تليجرام</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.telegram_enabled
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {config.telegram_enabled ? (
                                <><CheckCircle className="w-3.5 h-3.5" /><span>مفعل</span></>
                            ) : (
                                <><XCircle className="w-3.5 h-3.5" /><span>معطل</span></>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.telegram_enabled}
                            onChange={(e) => handleUpdate({ telegram_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            تفعيل إشعارات تليجرام
                        </span>
                    </label>
                    {config.telegram_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Bot Token
                                </label>
                                <input
                                    type="password"
                                    value={config.telegram_bot_token}
                                    onChange={(e) => handleUpdate({ telegram_bot_token: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                    placeholder="123456:ABC-DEF..."
                                    dir="ltr"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    احصل عليه من <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-500 underline">@BotFather</a>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Chat ID
                                </label>
                                <input
                                    type="text"
                                    value={config.telegram_chat_id}
                                    onChange={(e) => handleUpdate({ telegram_chat_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                    placeholder="-1001234567890"
                                    dir="ltr"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    معرف المجموعة/القناة (يبدأ بـ -)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* WhatsApp Card */}
            <Card className="overflow-hidden border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 transition-colors">
                <div className="bg-gradient-to-l from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-md">
                                <WhatsAppIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">WhatsApp</h3>
                                <p className="text-xs text-slate-500">إرسال الإشعارات عبر واتساب بيزنس API</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.whatsapp_enabled
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {config.whatsapp_enabled ? (
                                <><CheckCircle className="w-3.5 h-3.5" /><span>مفعل</span></>
                            ) : (
                                <><XCircle className="w-3.5 h-3.5" /><span>معطل</span></>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.whatsapp_enabled}
                            onChange={(e) => handleUpdate({ whatsapp_enabled: e.target.checked })}
                            className="w-5 h-5 text-green-600 rounded-lg focus:ring-green-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            تفعيل إشعارات واتساب
                        </span>
                    </label>
                    {config.whatsapp_enabled && (
                        <div className="space-y-4 mr-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                        رابط API
                                    </label>
                                    <input
                                        type="text"
                                        value={config.whatsapp_api_url}
                                        onChange={(e) => handleUpdate({ whatsapp_api_url: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                                        placeholder="https://graph.facebook.com/v17.0/..."
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                        API Key / Token
                                    </label>
                                    <input
                                        type="password"
                                        value={config.whatsapp_api_key}
                                        onChange={(e) => handleUpdate({ whatsapp_api_key: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                                        placeholder="Bearer token..."
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="max-w-sm">
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    رقم الهاتف المستلم
                                </label>
                                <input
                                    type="text"
                                    value={config.whatsapp_phone}
                                    onChange={(e) => handleUpdate({ whatsapp_phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                                    placeholder="+967123456789"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Event Toggles */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-l from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-4 border-b dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                            <Radio className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">الأحداث المُفعلة</h3>
                            <p className="text-xs text-slate-500">اختر المعاملات التي تريد إرسال إشعارات لها</p>
                        </div>
                    </div>
                </div>
                <div className="divide-y dark:divide-slate-800">
                    {eventToggles.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{event.emoji}</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{event.label}</p>
                                    <p className="text-[10px] text-slate-400">{event.desc}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config[event.id as keyof MessagingConfig] as boolean}
                                    onChange={(e) => handleUpdate({ [event.id]: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default MessagingIntegration;
