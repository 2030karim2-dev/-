/**
 * Text utilities — pure functions for text normalization and processing.
 */

/**
 * Normalizes Arabic text by removing diacritics, standardizing letter forms,
 * and trimming whitespace for consistent search comparison.
 *
 * Pure function — safe to use anywhere (server, worker, main thread).
 */
export const normalizeArabic = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
        .toString()
        .trim()
        // Remove diacritics (tashkeel)
        .replace(/[\u064B-\u065F\u0670]/g, '')
        // Remove tatweel
        .replace(/\u0640/g, '')
        // Normalize alef variants
        .replace(/[إأآا]/g, 'ا')
        // Normalize yaa
        .replace(/[يى]/g, 'ي')
        // Normalize taa marbuta
        .replace(/ة/g, 'ه')
        // Normalize hamza
        .replace(/[ؤئء]/g, 'ء')
        .toLowerCase();
};
