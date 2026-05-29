/**
 * Theme Lazy Loader - تحميل كسول للثيمات
 * يحسّن أداء التحميل الأولي بتأجيل تحميل الثيمات غير الأساسية
 */

import type { ThemePreset } from './types';

type ThemeLoader = () => Promise<Record<string, ThemePreset[]>>;

const loaders: Record<string, ThemeLoader> = {
    premium: () => import('./presets/premium'),
    warmAndRoyal: () => import('./presets/warmAndRoyal'),
    business: () => import('./presets/business'),
    creative: () => import('./presets/creative'),
    seasonalAndArtistic: () => import('./presets/seasonalAndArtistic'),
};

const cache = new Map<string, ThemePreset[]>();

export async function loadThemes(category: string): Promise<ThemePreset[]> {
    const cached = cache.get(category);
    if (cached) return cached;

    const loader = loaders[category];
    if (!loader) return [];

    const mod = await loader();
    const key = Object.keys(mod).find(k => k.endsWith('Presets')) || Object.keys(mod)[0];
    const presets = (mod[key]) || [];
    cache.set(category, presets);
    return presets;
}

export async function loadAllThemes(): Promise<ThemePreset[]> {
    const results = await Promise.all(Object.keys(loaders).map(loadThemes));
    return results.flat();
}