import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../hooks';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { FloatingInput } from './FloatingInput';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error } = useLogin();
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">أهلاً بك 👋</h2>
                <p className="text-sm text-gray-500 font-medium">قم بتسجيل الدخول للوصول للوحة التحكم</p>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/50 flex gap-2"
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <FloatingInput
                id="login-email"
                label={t('email_label')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={20} />}
                dir="ltr"
                autoComplete="email"
                required
            />

            <div className="space-y-2">
                <FloatingInput
                    id="login-password"
                    label={t('password_label')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={20} />}
                    dir="ltr"
                    autoComplete="current-password"
                    required
                    endIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onEndIconClick={() => setShowPassword(!showPassword)}
                />
                <div className="flex justify-start">
                    <a href="#/forgot-password" title="استعادة كلمة المرور" className="text-xs font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors uppercase">
                        نسيت كلمة المرور؟
                    </a>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
            >
                {isLoading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                ) : t('login_button')}
            </button>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">المطور الذكي</p>
                <p className="text-xs font-black text-gray-700 dark:text-slate-300">عبدالكريم الجعفري</p>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-blue-500 font-bold">
                    <span>779816860</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>2030.krim2@gmail.com</span>
                </div>
            </div>
        </form>
    );
};
