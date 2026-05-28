/**
 * Web Vitals Performance Monitoring
 * 
 * Reports Core Web Vitals in production (LCP, FID, CLS, INP, TTFB).
 * Only active when the app is in production mode to avoid console noise
 * during development.
 */
import { logger } from '../core/utils/logger';

type MetricName = 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB';

interface MetricEntry {
    name: MetricName;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

const RATING_THRESHOLDS: Record<MetricName, [number, number]> = {
    LCP: [2500, 4000],   // good < 2.5s, poor > 4s
    FID: [100, 300],      // good < 100ms, poor > 300ms
    CLS: [0.1, 0.25],     // good < 0.1, poor > 0.25
    INP: [200, 500],      // good < 200ms, poor > 500ms
    TTFB: [800, 1800],    // good < 0.8s, poor > 1.8s
};

function getRating(name: MetricName, value: number): MetricEntry['rating'] {
    const [good, poor] = RATING_THRESHOLDS[name];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
}

async function reportMetric(entry: MetricEntry): Promise<void> {
    const { name, value, rating, delta } = entry;

    // Log to our structured logger
    if (rating !== 'good') {
        logger.warn('WebVitals', `${name}: ${Math.round(value)} (${rating})`, {
            metric: name,
            value: Math.round(value),
            rating,
            delta: Math.round(delta),
        });
    }

    // In production, you could send to an analytics endpoint:
    // if (import.meta.env.PROD) {
    //   await fetch('/api/analytics/vitals', {
    //     method: 'POST',
    //     body: JSON.stringify(entry),
    //   });
    // }
}

export async function initPerformanceMonitoring(): Promise<void> {
    // Only initialize in production — avoids noise and overhead in dev
    if (!import.meta.env.PROD) return;

    try {
        const { onLCP, onCLS, onINP, onTTFB } = await import('web-vitals');

        const handleMetric = (metric: any) => {
            const entry: MetricEntry = {
                name: metric.name as MetricName,
                value: metric.value,
                rating: getRating(metric.name as MetricName, metric.value),
                delta: metric.delta,
                id: metric.id,
            };
            reportMetric(entry);
        };

        onLCP(handleMetric);
        onCLS(handleMetric);
        onINP(handleMetric);
        onTTFB(handleMetric);

        logger.info('WebVitals', 'Performance monitoring initialized (PROD only)');
    } catch {
        // web-vitals may not be available in all environments
        logger.debug('WebVitals', 'web-vitals library not available — skipping');
    }
}

export default initPerformanceMonitoring;