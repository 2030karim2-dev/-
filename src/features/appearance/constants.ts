
import { ThemePreset } from './types';

export const THEME_PRESETS: ThemePreset[] = [
  // ═══════════════════════════════════════════════════════════
  // 🏛️ كلاسيكي — Classic
  // ═══════════════════════════════════════════════════════════
  {
    id: 'clean-white',
    name: 'النظام الناصع',
    description: 'تصميم رسمي نظيف يركز على سهولة القراءة والوضوح التام.',
    colors: ['#3b82f6', '#60a5fa', '#f8fafc'],
    previewColor: '#ffffff',
    accent: '#3b82f6',
    isDark: false,
    category: 'classic',
    emoji: '⚪',
    cssVars: {
      '--app-bg': '#f4f6f9',
      '--app-surface': '#ffffff',
      '--app-surface-hover': '#eef1f6',
      '--app-border': '#d5dbe5',
      '--app-text': '#1a2332',
      '--app-text-secondary': '#5a6a7e',
      '--accent': '#3b82f6',
    }
  },
  {
    id: 'midnight-ocean',
    name: 'عمق المحيط',
    description: 'تباين مريح للعين في الإضاءة المنخفضة مع لمسات زرقاء.',
    colors: ['#38bdf8', '#3b82f6', '#1e293b'],
    previewColor: '#0f172a',
    accent: '#38bdf8',
    isDark: true,
    category: 'classic',
    emoji: '🌊',
    cssVars: {
      '--app-bg': '#0c1524',
      '--app-surface': '#141f33',
      '--app-surface-hover': '#1c2d48',
      '--app-border': '#253854',
      '--app-text': '#e8edf5',
      '--app-text-secondary': '#8da0be',
      '--accent': '#38bdf8',
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🏜️ بيج — Beige & Warm Tones
  // ═══════════════════════════════════════════════════════════
  {
    id: 'warm-sand',
    name: 'رمال دافئة',
    description: 'ألوان الرمال الذهبية مع درجات البيج الكلاسيكية. هدوء وأناقة.',
    colors: ['#d4a574', '#c4956a', '#faf5ef'],
    previewColor: '#fdf8f0',
    accent: '#c4956a',
    isDark: false,
    category: 'beige',
    emoji: '🏜️',
    cssVars: {
      '--app-bg': '#f6f0e6',
      '--app-surface': '#fdf8f0',
      '--app-surface-hover': '#f0e5d5',
      '--app-border': '#ddd0be',
      '--app-text': '#3a2c1e',
      '--app-text-secondary': '#7a6545',
      '--accent': '#c4956a',
    }
  },
  {
    id: 'desert-cream',
    name: 'كريم صحراوي',
    description: 'لون كريمي ناعم مع لمسات ذهبية فاخرة. مثالي للاستخدام الطويل.',
    colors: ['#c8960e', '#daa520', '#faebd7'],
    previewColor: '#faf0e6',
    accent: '#c8960e',
    isDark: false,
    category: 'beige',
    emoji: '🍶',
    cssVars: {
      '--app-bg': '#f5ecde',
      '--app-surface': '#fdf5ec',
      '--app-surface-hover': '#f0e2cc',
      '--app-border': '#ddd0b5',
      '--app-text': '#352510',
      '--app-text-secondary': '#7a6338',
      '--accent': '#c8960e',
    }
  },
  {
    id: 'champagne-gold',
    name: 'ذهب الشامبانيا',
    description: 'أناقة فاخرة بلون الشامبانيا الذهبي. للمظهر الاحترافي الراقي.',
    colors: ['#c9a96e', '#b8975a', '#f7f1e8'],
    previewColor: '#f5eedf',
    accent: '#b8975a',
    isDark: false,
    category: 'beige',
    emoji: '🥂',
    cssVars: {
      '--app-bg': '#f2eadb',
      '--app-surface': '#f9f3e8',
      '--app-surface-hover': '#ece2cf',
      '--app-border': '#d8ccb2',
      '--app-text': '#33291a',
      '--app-text-secondary': '#756548',
      '--accent': '#b8975a',
    }
  },
  {
    id: 'mocha-latte',
    name: 'موكا لاتيه',
    description: 'دفء القهوة بالحليب مع تدرجات بنية كريمية. مريح للعين.',
    colors: ['#8b6f47', '#a0845c', '#f3ece0'],
    previewColor: '#f0e8d8',
    accent: '#8b6f47',
    isDark: false,
    category: 'beige',
    emoji: '☕',
    cssVars: {
      '--app-bg': '#ece3d2',
      '--app-surface': '#f5efe2',
      '--app-surface-hover': '#e5d9c6',
      '--app-border': '#cfc0a8',
      '--app-text': '#2e2215',
      '--app-text-secondary': '#6b5638',
      '--accent': '#8b6f47',
    }
  },
  {
    id: 'rose-beige',
    name: 'بيج وردي',
    description: 'مزيج ناعم من البيج والوردي الفاتح. لمسة أنثوية عصرية.',
    colors: ['#c48b80', '#d4a090', '#faf0ee'],
    previewColor: '#fdf5f3',
    accent: '#c07060',
    isDark: false,
    category: 'beige',
    emoji: '🌸',
    cssVars: {
      '--app-bg': '#f6ece9',
      '--app-surface': '#fdf5f3',
      '--app-surface-hover': '#f0e3de',
      '--app-border': '#e0cdc7',
      '--app-text': '#3a2220',
      '--app-text-secondary': '#8b5852',
      '--accent': '#c07060',
    }
  },
  {
    id: 'midnight-caramel',
    name: 'كراميل ليلي',
    description: 'وضع مظلم دافئ بلون الكراميل البني. أناقة ليلية مميزة.',
    colors: ['#e8b878', '#d4a060', '#2c1810'],
    previewColor: '#1a1008',
    accent: '#e8b878',
    isDark: true,
    category: 'beige',
    emoji: '🌙',
    cssVars: {
      '--app-bg': '#13100a',
      '--app-surface': '#1e1810',
      '--app-surface-hover': '#2d2418',
      '--app-border': '#40321e',
      '--app-text': '#f0e4d0',
      '--app-text-secondary': '#b89868',
      '--accent': '#e8b878',
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 👑 ملكي — Royal & Luxury
  // ═══════════════════════════════════════════════════════════
  {
    id: 'royal-navy',
    name: 'أزرق ملكي',
    description: 'أزرق داكن فاخر مع لمسات ذهبية. أناقة الملوك والقصور.',
    colors: ['#fbbf24', '#c9a96e', '#1a2744'],
    previewColor: '#0f1a30',
    accent: '#f0b440',
    isDark: true,
    category: 'royal',
    emoji: '👑',
    cssVars: {
      '--app-bg': '#0c1525',
      '--app-surface': '#142035',
      '--app-surface-hover': '#1c2d48',
      '--app-border': '#263d5c',
      '--app-text': '#eae2d0',
      '--app-text-secondary': '#a09478',
      '--accent': '#f0b440',
    }
  },
  {
    id: 'royal-purple',
    name: 'بنفسجي ملكي',
    description: 'بنفسجي فاخر مع تدرجات ذهبية. فخامة ملكية راقية.',
    colors: ['#a78bfa', '#8b5cf6', '#f5f0ff'],
    previewColor: '#faf5ff',
    accent: '#8b5cf6',
    isDark: false,
    category: 'royal',
    emoji: '💜',
    cssVars: {
      '--app-bg': '#f0e8ff',
      '--app-surface': '#f9f5ff',
      '--app-surface-hover': '#e8daff',
      '--app-border': '#d4c0f0',
      '--app-text': '#2a1550',
      '--app-text-secondary': '#6d48a8',
      '--accent': '#8b5cf6',
    }
  },
  {
    id: 'royal-purple-dark',
    name: 'ليل بنفسجي',
    description: 'وضع مظلم بنفسجي ملكي. فخامة عميقة مع وضوح تام.',
    colors: ['#c084fc', '#a855f7', '#1a0830'],
    previewColor: '#120520',
    accent: '#c084fc',
    isDark: true,
    category: 'royal',
    emoji: '🔮',
    cssVars: {
      '--app-bg': '#0e0820',
      '--app-surface': '#18102e',
      '--app-surface-hover': '#241840',
      '--app-border': '#342458',
      '--app-text': '#e8daf5',
      '--app-text-secondary': '#a080cc',
      '--accent': '#c084fc',
    }
  },
  {
    id: 'royal-emerald',
    name: 'زمردي ملكي',
    description: 'أخضر زمردي ملكي مع ذهب. رمز الرخاء والثروة.',
    colors: ['#fbbf24', '#10b981', '#f0faf5'],
    previewColor: '#f0fdf4',
    accent: '#0d9668',
    isDark: false,
    category: 'royal',
    emoji: '💎',
    cssVars: {
      '--app-bg': '#ecf7f0',
      '--app-surface': '#f5fdf8',
      '--app-surface-hover': '#e0f2e8',
      '--app-border': '#c0deca',
      '--app-text': '#0f2d1e',
      '--app-text-secondary': '#3d7a58',
      '--accent': '#0d9668',
    }
  },
  {
    id: 'royal-burgundy',
    name: 'عنابي ملكي',
    description: 'أحمر بورغندي فاخر. لون النبيذ الملكي مع ذهب دافئ.',
    colors: ['#f59e0b', '#dc2626', '#1c0808'],
    previewColor: '#140505',
    accent: '#e8a040',
    isDark: true,
    category: 'royal',
    emoji: '🍷',
    cssVars: {
      '--app-bg': '#10060a',
      '--app-surface': '#1c0c12',
      '--app-surface-hover': '#2a141e',
      '--app-border': '#401828',
      '--app-text': '#f0dcd0',
      '--app-text-secondary': '#c08868',
      '--accent': '#e8a040',
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 📊 محاسبي — Accounting & Finance
  // ═══════════════════════════════════════════════════════════
  {
    id: 'finance-blue',
    name: 'أزرق مالي',
    description: 'الأزرق المصرفي الرسمي. احترافي وموثوق للأنظمة المالية.',
    colors: ['#1d4ed8', '#3b82f6', '#eff6ff'],
    previewColor: '#f0f6ff',
    accent: '#1d4ed8',
    isDark: false,
    category: 'accounting',
    emoji: '🏦',
    cssVars: {
      '--app-bg': '#edf2fd',
      '--app-surface': '#f5f8ff',
      '--app-surface-hover': '#dce6f8',
      '--app-border': '#bccee8',
      '--app-text': '#0f1d3a',
      '--app-text-secondary': '#405880',
      '--accent': '#1d4ed8',
    }
  },
  {
    id: 'finance-green',
    name: 'أخضر مالي',
    description: 'أخضر الأرباح والنمو. يوحي بالاستقرار المالي والنجاح.',
    colors: ['#16a34a', '#22c55e', '#f0fdf4'],
    previewColor: '#f0fdf4',
    accent: '#16a34a',
    isDark: false,
    category: 'accounting',
    emoji: '💰',
    cssVars: {
      '--app-bg': '#edf8f0',
      '--app-surface': '#f5fdf7',
      '--app-surface-hover': '#dcf2e2',
      '--app-border': '#b8dec5',
      '--app-text': '#0c2a15',
      '--app-text-secondary': '#326845',
      '--accent': '#16a34a',
    }
  },
  {
    id: 'finance-dark',
    name: 'ليل مالي',
    description: 'وضع مظلم احترافي للمحاسبين. أرقام واضحة وتباين ممتاز.',
    colors: ['#4ade80', '#22c55e', '#0a1a10'],
    previewColor: '#0a1a10',
    accent: '#4ade80',
    isDark: true,
    category: 'accounting',
    emoji: '📈',
    cssVars: {
      '--app-bg': '#080f0c',
      '--app-surface': '#101c15',
      '--app-surface-hover': '#1a2e22',
      '--app-border': '#243d2e',
      '--app-text': '#d8f5e2',
      '--app-text-secondary': '#70c090',
      '--accent': '#4ade80',
    }
  },
  {
    id: 'finance-slate',
    name: 'رمادي رسمي',
    description: 'رمادي محايد احترافي. مثالي للتدقيق والتقارير المالية.',
    colors: ['#475569', '#64748b', '#f1f5f9'],
    previewColor: '#f8fafc',
    accent: '#475569',
    isDark: false,
    category: 'accounting',
    emoji: '📋',
    cssVars: {
      '--app-bg': '#eef1f5',
      '--app-surface': '#f8fafc',
      '--app-surface-hover': '#e2e8f0',
      '--app-border': '#c8d0dc',
      '--app-text': '#141c28',
      '--app-text-secondary': '#4a5568',
      '--accent': '#475569',
    }
  },
  {
    id: 'finance-teal',
    name: 'تركوازي مالي',
    description: 'تركوازي عصري للأنظمة المالية الحديثة. حيوية واحترافية.',
    colors: ['#0d9488', '#14b8a6', '#f0fdfa'],
    previewColor: '#f0fdfa',
    accent: '#0d9488',
    isDark: false,
    category: 'accounting',
    emoji: '💹',
    cssVars: {
      '--app-bg': '#e8f8f5',
      '--app-surface': '#f0fdfa',
      '--app-surface-hover': '#d8f0ec',
      '--app-border': '#b0dcd5',
      '--app-text': '#0a2824',
      '--app-text-secondary': '#2d706a',
      '--accent': '#0d9488',
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🌿 طبيعي — Nature
  // ═══════════════════════════════════════════════════════════
  {
    id: 'emerald-forest',
    name: 'غابة زمردية',
    description: 'أخضر زمردي غني. إحساس بالطبيعة والانتعاش.',
    colors: ['#059669', '#10b981', '#ecfdf5'],
    previewColor: '#f0fdf4',
    accent: '#059669',
    isDark: false,
    category: 'nature',
    emoji: '🌿',
    cssVars: {
      '--app-bg': '#ebf7f0',
      '--app-surface': '#f5fdf8',
      '--app-surface-hover': '#daf0e4',
      '--app-border': '#b8dcc8',
      '--app-text': '#0e2a1c',
      '--app-text-secondary': '#367a55',
      '--accent': '#059669',
    }
  },
  {
    id: 'deep-forest',
    name: 'ليل الغابة',
    description: 'أخضر غامق غني مع ظلال الليل. هدوء واحترافية.',
    colors: ['#34d399', '#10b981', '#0f2922'],
    previewColor: '#0a1f17',
    accent: '#34d399',
    isDark: true,
    category: 'nature',
    emoji: '🌲',
    cssVars: {
      '--app-bg': '#080f0c',
      '--app-surface': '#10201a',
      '--app-surface-hover': '#183028',
      '--app-border': '#204038',
      '--app-text': '#d0f0e0',
      '--app-text-secondary': '#60b88a',
      '--accent': '#34d399',
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 جريء — Bold
  // ═══════════════════════════════════════════════════════════
  {
    id: 'crimson-dark',
    name: 'قرمزي مظلم',
    description: 'أحمر قرمزي عميق في وضع مظلم. قوة وتميّز.',
    colors: ['#f87171', '#ef4444', '#1c0a0a'],
    previewColor: '#170808',
    accent: '#f87171',
    isDark: true,
    category: 'bold',
    emoji: '🔥',
    cssVars: {
      '--app-bg': '#100606',
      '--app-surface': '#1c0c0c',
      '--app-surface-hover': '#2c1414',
      '--app-border': '#401818',
      '--app-text': '#f5d8d8',
      '--app-text-secondary': '#d07070',
      '--accent': '#f87171',
    }
  },
  {
    id: 'sunset-orange',
    name: 'غروب برتقالي',
    description: 'ألوان الغروب الدافئة. طاقة إيجابية وحيوية.',
    colors: ['#f97316', '#fb923c', '#fff7ed'],
    previewColor: '#fff7ed',
    accent: '#ea6c0c',
    isDark: false,
    category: 'bold',
    emoji: '🌅',
    cssVars: {
      '--app-bg': '#fef0e0',
      '--app-surface': '#fff8ef',
      '--app-surface-hover': '#fde8d0',
      '--app-border': '#f0d0a8',
      '--app-text': '#3a1e08',
      '--app-text-secondary': '#8a5a28',
      '--accent': '#ea6c0c',
    }
  },
];

// تصنيفات الثيمات مع الأسماء العربية
export const THEME_CATEGORIES = {
  classic: { label: 'كلاسيكي', emoji: '🏛️', description: 'التصاميم الرسمية التقليدية' },
  beige: { label: 'بيج ودافئ', emoji: '🏜️', description: 'ألوان الرمال والكريم والكراميل' },
  royal: { label: 'ملكي فاخر', emoji: '👑', description: 'ألوان ملكية فخمة مع لمسات ذهبية' },
  accounting: { label: 'محاسبي', emoji: '📊', description: 'ألوان احترافية للأنظمة المالية' },
  nature: { label: 'طبيعي', emoji: '🌿', description: 'ألوان الطبيعة والغابات' },
  bold: { label: 'جريء', emoji: '🔥', description: 'ألوان قوية ومميزة' },
} as const;
