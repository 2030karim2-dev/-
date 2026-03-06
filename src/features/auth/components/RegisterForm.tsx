import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useRegister } from '../hooks';
import { FloatingInput } from './FloatingInput';

export const RegisterForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [formData, setFormData] = useState({ fullName: '', companyName: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading, error, isSuccess } = useRegister();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        register(formData.email, formData.password, formData.companyName, formData.fullName);
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                    <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">تم التسجيل بنجاح!</h3>
                <p className="text-gray-500 dark:text-slate-400 font-medium mb-8">لقد أرسلنا رابط تفعيل إلى <br /><span className="text-blue-600 font-mono font-bold text-xs">{formData.email}</span></p>
                <button onClick={onSuccess} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95">استمر لتسجيل الدخول</button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">ابدأ الآن 🚀</h2>
                <p className="text-sm text-gray-500 font-medium">خطوات بسيطة وسيكون نظامك جاهزاً</p>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/50 flex gap-2">
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <FloatingInput id="reg-name" label="الاسم الكامل" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} icon={<User size={18} />} required />
            <FloatingInput id="reg-company" label="اسم المشروع / المحل" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} icon={<Building size={18} />} required />
            <FloatingInput id="reg-email" label="البريد الإلكتروني" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} icon={<Mail size={18} />} dir="ltr" required />
            <FloatingInput
                id="reg-pass" label="كلمة المرور" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} icon={<Lock size={18} />} dir="ltr" required minLength={8}
                endIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />} onEndIconClick={() => setShowPassword(!showPassword)}
            />

            <button
                type="submit" disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 text-lg mt-4"
            >
                {isLoading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                ) : 'إنشاء حسابي المجاني'}
            </button>
        </form>
    );
};
