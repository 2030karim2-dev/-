import { ThemePreset } from './types';
import { premiumPresets } from './presets/premium';
import { warmAndRoyalPresets } from './presets/warmAndRoyal';
import { businessPresets } from './presets/business';
import { creativePresets } from './presets/creative';
import { seasonalAndArtisticPresets } from './presets/seasonalAndArtistic';

export const THEME_PRESETS: ThemePreset[] = [
  ...premiumPresets,
  ...warmAndRoyalPresets,
  ...businessPresets,
  ...creativePresets,
  ...seasonalAndArtisticPresets,
];

// تصنيفات الثيمات مع الأسماء العربية
export const THEME_CATEGORIES = {
  premium: { label: 'باقات برو الاحترافية', emoji: '✨', description: 'ثيمات ذكية تدعم الوضعين الليلي والنهاري تلقائياً' },
  classic: { label: 'كلاسيكي', emoji: '🏛️', description: 'التصاميم الرسمية التقليدية' },
  beige: { label: 'بيج ودافئ', emoji: '🏜️', description: 'ألوان الرمال والكريم والكراميل' },
  royal: { label: 'ملكي فاخر', emoji: '👑', description: 'ألوان ملكية فخمة مع لمسات ذهبية' },
  accounting: { label: 'محاسبي', emoji: '📊', description: 'ألوان احترافية للأنظمة المالية' },
  nature: { label: 'طبيعي', emoji: '🌿', description: 'ألوان الطبيعة والغابات' },
  bold: { label: 'جريء', emoji: '🔥', description: 'ألوان قوية ومميزة' },
  corporate: { label: 'شركة حديث', emoji: '🏢', description: 'ألوان للشركات الناشئة والتقنية' },
  night: { label: 'ليلي', emoji: '🌙', description: 'ثيمات ليلية داكنة وأنيقة' },
  seasonal: { label: 'موسيقي', emoji: '🌸', description: 'ألوان موسمية متغيرة' },
  artistic: { label: 'فني', emoji: '🎨', description: 'ألوان فنية وإبداعية' },
  industry: { label: 'قطاعي', emoji: '🏭', description: 'ألوان متخصصة للصناعات المختلفة' },
  glass: { label: 'زجاجي (Glass)', emoji: '🪟', description: 'تأثيرات الشفافية والبلور العصرية' },
  bento: { label: 'بينتو (Bento)', emoji: '🍱', description: 'تقسيمات شبكية احترافية للبيانات' },
} as const;
