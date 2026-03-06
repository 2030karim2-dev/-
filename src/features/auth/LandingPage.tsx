import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    Car, Mail, Package, FileText,
    BarChart3, Sun, Moon, Shield, Zap, ArrowLeft, ArrowRight,
    Users, Globe, Heart, Menu, X
} from 'lucide-react';
import { useTranslation } from '../../lib/hooks/useTranslation';
import { useThemeStore } from '../../lib/themeStore';
import { DashboardMockup, StepIllustration, AutoPattern } from './components/LandingIllustrations';
import { AnimatedCounter } from './components/AnimatedCounter';
import { SectionHeader } from './components/SectionHeader';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

// ─── Main Landing Page ─────────────────────────────────────────────
const LandingPage: React.FC = () => {
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { dir } = useTranslation();
    const { theme, toggleTheme } = useThemeStore();
    const authRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const howItWorksRef = useRef<HTMLDivElement>(null);

    const scrollToAuth = useCallback(() => {
        authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    // ── Animation Variants ──
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
    };

    return (
        <div
            dir={dir}
            className="min-h-screen bg-white dark:bg-slate-950 font-sans transition-colors duration-500 overflow-x-hidden selection:bg-blue-100 selection:text-blue-600 dark:selection:bg-blue-500/30 dark:selection:text-blue-200"
        >
            {/* ── Background Patterns ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_50%)]" />
                <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent" />
                <AutoPattern className="top-[10%] left-[5%] text-blue-500" />
                <AutoPattern className="bottom-[15%] right-[5%] text-emerald-500 rotate-180 scale-75" />

                {/* Dynamic animated blobs */}
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[15%] right-[5%] w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 60, 0],
                        scale: [1, 0.9, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-[100px]"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] dark:opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            </div>

            {/* ─── Header ──────────────────────────────────────────── */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            >
                <div className="max-w-[1600px] mx-auto px-4 py-6">
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[2rem] shadow-2xl shadow-blue-500/5 px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.5 }}
                                className="w-12 h-12 bg-gradient-to-tr from-blue-700 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                            >
                                <Car className="text-white" size={26} />
                            </motion.div>
                            <div className="hidden sm:block">
                                <span className="block text-lg font-black text-gray-900 dark:text-white leading-none tracking-tight">نظام الزهراء</span>
                                <span className="block text-[10px] text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] font-black mt-1">Auto Parts ERP</span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-10 text-sm font-black text-gray-500 dark:text-slate-400">
                            {['الميزات', 'كيف يعمل', 'الأسعار', 'الدخول'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        if (item === 'الميزات') featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        if (item === 'كيف يعمل') howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        if (item === 'الدخول') scrollToAuth();
                                    }}
                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gray-100/50 dark:bg-slate-800/50 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-600 shadow-sm"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={scrollToAuth}
                                className="hidden sm:flex px-6 sm:px-8 h-10 sm:h-11 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all border border-blue-400/20 items-center"
                            >
                                سجل الآن
                            </motion.button>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-10 h-10 rounded-2xl bg-gray-100/50 dark:bg-slate-800/50 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-gray-100 dark:border-slate-800 mt-2 mx-4 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 flex flex-col gap-6 font-black text-gray-600 dark:text-slate-400">
                                {['الميزات', 'كيف يعمل', 'الأسعار', 'الدخول'].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            if (item === 'الميزات') featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                                            if (item === 'كيف يعمل') howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
                                            if (item === 'الدخول') scrollToAuth();
                                        }}
                                        className="text-right hover:text-blue-600 transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        scrollToAuth();
                                    }}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"
                                >
                                    ابدأ الآن مجاناً
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* ─── Hero Section ────────────────────────────────────── */}
            <section className="relative pt-32 lg:pt-0 pb-20 px-4 z-10 lg:flex lg:items-center lg:min-h-screen">
                <div className="max-w-[1600px] mx-auto w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Hero Text */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="text-center lg:text-right"
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6 border border-blue-200/50 dark:border-blue-800/50">
                                <Zap size={14} fill="currentColor" /> حوّل تجارتك إلى الرقمية اليوم
                            </motion.div>

                            <motion.h1
                                variants={itemVariants}
                                className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 dark:text-white leading-[1.05] mb-8 tracking-tighter"
                            >
                                أحدث تقنيات <br />
                                <span className="bg-gradient-to-l from-blue-700 via-blue-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
                                    إدارة قطع الغيار
                                </span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                نظام الزهراء هو الحل السحابي المتكامل لإدارة المخازن، المبيعات، والعملاء لمحلات قطع غيار السيارات. سرعة، دقة، وسهولة في الاستخدام.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-center lg:justify-start">
                                <button
                                    onClick={scrollToAuth}
                                    className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 text-base sm:text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all active:scale-95 border border-white/10"
                                >
                                    ابدأ مجاناً الآن
                                    <ArrowIcon size={22} />
                                </button>
                                <button
                                    onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-gray-700 dark:text-white border-2 border-gray-100 dark:border-slate-800 rounded-2xl font-black hover:border-blue-500 hover:bg-white dark:hover:bg-slate-900 transition-all active:scale-95 shadow-sm text-sm sm:text-base"
                                >
                                    مشاهدة المميزات
                                </button>
                            </motion.div>

                            {/* Stats Grid */}
                            <motion.div variants={itemVariants} className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 border-t border-gray-100 dark:border-slate-800 pt-8">
                                {[
                                    { label: 'عميل نشط', value: 1200, suffix: '+' },
                                    { label: 'فاتورة منجزة', value: 45, suffix: 'K+' },
                                    { label: 'قطعة مدارة', value: 250, suffix: 'K+' },
                                ].map((stat, i) => (
                                    <div key={stat.label} className={i === 2 ? "col-span-2 sm:col-span-1" : ""}>
                                        <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* Hero Illustration */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="relative rounded-[2.5rem] p-4 lg:p-8"
                        >
                            <DashboardMockup className="relative z-10" />
                            {/* Backdrops */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[100px] rounded-full z-0" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ────────────────────────────────── */}
            <section ref={featuresRef} className="relative py-32 px-4 z-10 bg-gray-50/50 dark:bg-transparent overflow-hidden">
                <div className="max-w-[1600px] mx-auto">
                    <SectionHeader
                        badge="ميزات متقدمة"
                        title="كل ما تحتاجه لإدارة تجارتك باحترافية"
                        description="لقد بنينا نظام الزهراء ليكون المساعد الأول لك في عملك اليومي، مع أدوات تغطي أدق تفاصيل إدارة محلك."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Package,
                                title: 'إدارة مخزون ذكية',
                                desc: 'تتبع كل برغي في مخزنك، مع تنبيهات تلقائية بالأصناف التي أوشكت على النفاد وتقارير بالنقص.',
                                color: 'blue'
                            },
                            {
                                icon: FileText,
                                title: 'نظام فواتير متطور',
                                desc: 'أصدر فواتير ضريبية، فواتير عرض، وفواتير مرتجعات في ثوانٍ معدودة مع دعم كامل للباركود.',
                                color: 'emerald'
                            },
                            {
                                icon: Users,
                                title: 'إدارة العملاء والموردين',
                                desc: 'قاعدة بيانات شاملة لعملائك مع تتبع الحسابات الآجلة والمدفوعات والديون بدقة متناهية.',
                                color: 'orange'
                            },
                            {
                                icon: BarChart3,
                                title: 'تقارير وشاشات تحليلية',
                                desc: 'شاهد نمو مبيعاتك وأرباحك اليومية والشهرية من خلال لوحات بيانات تفاعلية ورسوم بيانية.',
                                color: 'purple'
                            },
                            {
                                icon: Shield,
                                title: 'أمان عالي ونسخ احتياطي',
                                desc: 'بياناتك محفوظة في سحابة مشفرة مع نسخ احتياطي يومي يضمن عدم فقدان أي معلومة أبداً.',
                                color: 'indigo'
                            },
                            {
                                icon: Zap,
                                title: 'ذكاء اصطناعي مدمج',
                                desc: 'مساعد ذكي يحلل بياناتك ويسرع عمليات الإدخال ويقترح عليك الكميات المناسبة للشراء.',
                                color: 'amber'
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-default"
                            >
                                <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm
                  ${feature.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 shadow-blue-200/50' :
                                        feature.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-emerald-200/50' :
                                            feature.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 shadow-orange-200/50' :
                                                feature.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 shadow-purple-200/50' :
                                                    feature.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 shadow-indigo-200/50' :
                                                        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 shadow-amber-200/50'
                                    } `}
                                >
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-slate-400 leading-relaxed font-medium text-base">{feature.desc}</p>
                                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400">
                                    اكتشف المزيد <ArrowIcon size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ────────────────────────────────────── */}
            <section ref={howItWorksRef} className="relative py-32 px-4 z-10 overflow-hidden">
                <div className="max-w-[1600px] mx-auto">
                    <SectionHeader
                        badge="خطوات بسيطة"
                        title="ابدأ العمل خلال دقائق معدودة"
                        description="لقد صممنا النظام ليكون سهلاً للغاية، لا يحتاج لتدريب طويل، فقط اتبع هذه الخطوات."
                    />

                    <div className="relative">
                        {/* Connection Line */}
                        <div className="hidden lg:block absolute top-[120px] left-1/2 -translate-x-1/2 w-[70%] h-0.5 bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-800 to-transparent" />

                        <div className="grid lg:grid-cols-3 gap-12 relative z-10">
                            {[
                                { step: 1, title: 'أنشئ حسابك', desc: 'سجل بيانات محلك واختر الثيم المناسب لهويتك التجارية في ثوانٍ معدودة.' },
                                { step: 2, title: 'أدخل مخزونك', desc: 'ارفع ملفات الإكسيل الخاصة بقطع الغيار أو ابدأ الإدخال بالباركود الذكي.' },
                                { step: 3, title: 'ابدأ البيع', desc: 'أصدر فواتيرك الاحترافية وتابع مبيعاتك لحظة بلحظة من أي جهاز.' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.2 }}
                                    className="relative group"
                                >
                                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-center">
                                        <div className="w-24 h-24 mx-auto mb-10 bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                                            <StepIllustration step={item.step} />
                                        </div>
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm mb-6 shadow-lg shadow-blue-500/40">
                                            {item.step}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA & Auth Section ─────────────────────────────── */}
            <section ref={authRef} className="relative py-32 px-4 z-10 bg-slate-900 overflow-hidden">
                {/* Background blobs for CTA */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 blur-[150px]" />

                <div className="max-w-[1600px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* CTA Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-center lg:text-right"
                        >
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-block px-4 py-1.5 bg-blue-500/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20 text-blue-400"
                            >
                                انضم إلى المستقبل
                            </motion.span>
                            <h2 className="text-4xl lg:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                                هل أنت مستعد <br />
                                لتطوير <span className="text-blue-400 bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">تجارتك؟</span>
                            </h2>
                            <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium opacity-80">
                                انضم إلى مئات أصحاب مراكز قطع الغيار الذين يثقون في "نظام الزهراء" لإدارة أعمالهم اليومية بكفاءة واحترافية لا مثيل لها.
                            </p>

                            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                                <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/50">
                                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                                        <Shield size={22} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-sm">آمن تماماً</div>
                                        <div className="text-[10px] text-slate-500">تشفير بيانات عسكري</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/50">
                                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                                        <Zap size={22} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-sm">سريع الاستجابة</div>
                                        <div className="text-[10px] text-slate-500">أداء فائق للوحة التحكم</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Auth Form Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="w-full max-w-md mx-auto"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 overflow-hidden border border-white dark:border-slate-800 relative z-10">
                                {/* Tab Header */}
                                <div className="flex relative border-b border-gray-100 dark:border-slate-800">
                                    {(['login', 'register'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setAuthTab(tab)}
                                            className={`relative flex - 1 py - 5 text - sm font - black transition - colors z - 10
                        ${authTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} `}
                                        >
                                            {tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                                        </button>
                                    ))}
                                    <motion.div
                                        layoutId="auth-pill"
                                        className="absolute bottom-0 h-0.5 bg-blue-500 rounded-full"
                                        style={{ width: '50%' }}
                                        animate={{ [dir === 'rtl' ? 'right' : 'left']: authTab === 'login' ? '0%' : '50%' }}
                                    />
                                </div>

                                <div className="p-8 sm:p-10 min-h-[450px]">
                                    <AnimatePresence mode="wait">
                                        {authTab === 'login' ? (
                                            <motion.div
                                                key="login"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <LoginForm />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="register"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <RegisterForm onSuccess={() => setAuthTab('login')} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <footer className="relative bg-slate-950 pt-32 pb-12 overflow-hidden border-t border-slate-900">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                <div className="max-w-[1600px] mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-24">
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                                    <Car className="text-white" size={26} />
                                </div>
                                <div>
                                    <span className="block text-xl font-black text-white leading-none tracking-tight">نظام الزهراء</span>
                                    <span className="block text-[10px] text-blue-500 uppercase tracking-[0.2em] font-black mt-1">Auto Parts ERP</span>
                                </div>
                            </div>
                            <p className="text-slate-500 leading-relaxed font-medium mb-10 text-base">
                                المنصة العربية الرائدة في إدارة محلات ومراكز صيانة السيارات. نوفر حلولاً عالمية لتبسيط عملياتكم وزيادة أرباحكم.
                                <br />
                                <span className="text-blue-400 mt-2 block">الجمهورية اليمنية - المهرة</span>
                            </p>
                            <div className="flex gap-4">
                                {[Globe, Mail, Users].map((Icon, i) => (
                                    <button key={i} className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-sm group">
                                        <Icon size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-black mb-8 lg:mb-10 text-lg uppercase tracking-tight">الروابط السريعة</h4>
                            <ul className="space-y-4 lg:space-y-5 font-medium text-slate-500">
                                <li><button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-400 transition-colors">الميزات الرئيسية</button></li>
                                <li><button onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-400 transition-colors">كيفية الاستخدام</button></li>
                                <li><button onClick={scrollToAuth} className="hover:text-blue-400 transition-colors">تسجيل الدخول</button></li>
                                <li><button className="hover:text-blue-400 transition-colors">الأسعار والباقات</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-black mb-8 lg:mb-10 text-lg uppercase tracking-tight">الدعم والمساعدة</h4>
                            <ul className="space-y-4 lg:space-y-5 font-medium text-slate-500">
                                <li><a href="#" className="hover:text-blue-400 transition-colors">الأسئلة الشائعة</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">سياسة الخصوصية</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">شروط الاستخدام</a></li>
                                <li><a href="mailto:2030.krim2@gmail.com" className="hover:text-blue-400 transition-colors">اتصل بنا</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-black mb-8 lg:mb-10 text-lg uppercase tracking-tight">النشرة البريدية</h4>
                            <p className="text-slate-500 mb-8 font-medium">اشترك لتصلك أحدث الميزات والتحديثات الدورية بنظامنا.</p>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 text-white shadow-inner"
                                />
                                <button className="absolute left-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-[0.9rem] font-black text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                    اشترك
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
                        <p className="text-slate-600 text-sm font-bold">
                            © {new Date().getFullYear()} نظام الزهراء. جميع الحقوق محفوظة.
                        </p>
                        <div className="flex items-center gap-3 text-slate-600 text-sm font-bold bg-slate-900/50 px-6 py-3 rounded-full border border-slate-900">
                            صنع بكل <Heart size={16} className="text-rose-500 animate-pulse fill-rose-500" /> لمستقبل أذكى
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// LoginForm and RegisterForm have been moved to separate files

export default LandingPage;
