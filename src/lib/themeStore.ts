
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEME_PRESETS } from '../features/appearance/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeSettings {
  accentColor: string;
  font: string;
  radius: number;
  fontSize: number;
  shadowStrength: number;
}

interface ThemeState {
  mode: ThemeMode;
  theme: 'light' | 'dark';
  activePresetId: string;

  accentColor: string;
  font: string;
  radius: number;
  fontSize: number;
  shadowStrength: number;

  draftSettings: ThemeSettings;

  setMode: (mode: ThemeMode) => void;
  setPreset: (id: string) => void;

  setDraftAccentColor: (color: string) => void;
  setDraftFont: (font: string) => void;
  setDraftRadius: (radius: number) => void;
  setDraftFontSize: (size: number) => void;
  setDraftShadowStrength: (strength: number) => void;

  saveAppearanceSettings: () => void;
  revertAppearanceSettings: () => void;

  initializeTheme: () => void;
  toggleTheme: () => void;
}

const applyTheme = (mode: ThemeMode): 'light' | 'dark' => {
  const themeToApply = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  document.documentElement.classList.toggle('dark', themeToApply === 'dark');
  return themeToApply;
};

const applyAccent = (color: string) => document.documentElement.style.setProperty('--accent', color);
const applyFont = (font: string) => document.documentElement.style.setProperty('--font-sans', font);
const applyRadius = (radius: number) => document.documentElement.style.setProperty('--radius', `${radius}rem`);
const applyFontSize = (size: number) => document.documentElement.style.fontSize = `${size}px`;
const applyShadowStrength = (strength: number) => document.documentElement.style.setProperty('--shadow-strength', strength.toString());

// تطبيق CSS variables الخاصة بالثيم على DOM
const applyPresetCSSVars = (presetId: string) => {
  const preset = THEME_PRESETS.find(p => p.id === presetId);
  if (!preset?.cssVars) return;

  const root = document.documentElement;
  Object.entries(preset.cssVars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      theme: 'light',
      activePresetId: 'clean-white',
      accentColor: '#10b981',
      font: 'Cairo',
      radius: 0.5,
      fontSize: 14,
      shadowStrength: 0.05,
      draftSettings: {
        accentColor: '#10b981',
        font: 'Cairo',
        radius: 0.5,
        fontSize: 14,
        shadowStrength: 0.05,
      },

      initializeTheme: () => {
        const { mode, accentColor, font, radius, fontSize, shadowStrength, activePresetId } = get();

        const initialTheme = applyTheme(mode);
        // تطبيق CSS variables الثيم المحفوظ
        applyPresetCSSVars(activePresetId);

        set({
          theme: initialTheme,
          draftSettings: { accentColor, font, radius, fontSize, shadowStrength }
        });

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          if (get().mode === 'system') {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', e.matches);
            set({ theme: newTheme });
          }
        });
      },

      setMode: (mode) => {
        const newTheme = applyTheme(mode);
        set({ mode, theme: newTheme });
      },

      // تطبيق الثيم فعلياً مع جميع CSS variables
      setPreset: (id) => {
        const preset = THEME_PRESETS.find(p => p.id === id);
        if (!preset) return;

        // تطبيق الوضع (نهاري/ليلي) تلقائياً
        const newTheme = applyTheme(preset.isDark ? 'dark' : 'light');

        // تطبيق CSS variables
        applyPresetCSSVars(id);

        // تطبيق لون accent
        if (preset.accent) {
          applyAccent(preset.accent);
        }

        set({
          activePresetId: id,
          mode: preset.isDark ? 'dark' : 'light',
          theme: newTheme,
          ...(preset.accent ? {
            accentColor: preset.accent,
            draftSettings: { ...get().draftSettings, accentColor: preset.accent }
          } : {})
        });
      },

      setDraftAccentColor: (color) => {
        applyAccent(color);
        set(state => ({ draftSettings: { ...state.draftSettings, accentColor: color } }));
      },
      setDraftFont: (font) => {
        applyFont(font);
        set(state => ({ draftSettings: { ...state.draftSettings, font } }));
      },
      setDraftRadius: (radius) => {
        applyRadius(radius);
        set(state => ({ draftSettings: { ...state.draftSettings, radius } }));
      },
      setDraftFontSize: (size) => {
        applyFontSize(size);
        set(state => ({ draftSettings: { ...state.draftSettings, fontSize: size } }));
      },
      setDraftShadowStrength: (strength) => {
        applyShadowStrength(strength);
        set(state => ({ draftSettings: { ...state.draftSettings, shadowStrength: strength } }));
      },

      saveAppearanceSettings: () => {
        const { draftSettings } = get();
        set({
          accentColor: draftSettings.accentColor,
          font: draftSettings.font,
          radius: draftSettings.radius,
          fontSize: draftSettings.fontSize,
          shadowStrength: draftSettings.shadowStrength,
        });
      },

      revertAppearanceSettings: () => {
        const { accentColor, font, radius, fontSize, shadowStrength } = get();
        applyAccent(accentColor);
        applyFont(font);
        applyRadius(radius);
        applyFontSize(fontSize);
        applyShadowStrength(shadowStrength);
        set({
          draftSettings: { accentColor, font, radius, fontSize, shadowStrength }
        });
      },

      toggleTheme: () => {
        const { theme } = get();
        const newMode = theme === 'light' ? 'dark' : 'light';
        const newTheme = applyTheme(newMode as ThemeMode);
        set({ mode: newMode, theme: newTheme });
      },
    }),
    {
      name: 'al-zahra-appearance-storage',
      partialize: (state) => ({
        mode: state.mode,
        activePresetId: state.activePresetId,
        accentColor: state.accentColor,
        font: state.font,
        radius: state.radius,
        fontSize: state.fontSize,
        shadowStrength: state.shadowStrength,
      }),
      onRehydrateStorage: (persistedState) => {
        if (persistedState) {
          applyTheme(persistedState.mode);
          applyAccent(persistedState.accentColor);
          applyFont(persistedState.font);
          applyRadius(persistedState.radius);
          applyFontSize(persistedState.fontSize);
          applyShadowStrength(persistedState.shadowStrength);
          // تطبيق CSS variables الثيم المحفوظ عند تحميل الصفحة
          applyPresetCSSVars(persistedState.activePresetId);
        }
      },
    }
  )
);
