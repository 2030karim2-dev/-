import { useCallback, useMemo } from 'react';
import { useI18nStore } from '../i18nStore';

export const useTranslation = () => {
  const { lang, dir, dictionary } = useI18nStore();

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let translation = dictionary[key] || key;

    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, replacements[rKey]);
      });
    }

    return translation;
  }, [dictionary]);

  const formatDate = useCallback((date: string | Date): string => {
    const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [lang]);

  // Stabilize the return object reference using useMemo
  return useMemo(() => ({ t, lang, dir, formatDate }), [t, lang, dir, formatDate]);
};
