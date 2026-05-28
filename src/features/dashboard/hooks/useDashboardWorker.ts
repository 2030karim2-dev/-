import { useEffect, useState, useRef, useCallback } from 'react';

export interface DashboardWorkerInput {
    invoicesData: any[];
    expensesData: any[];
    invoiceItemsData: any[];
    baseMetrics: any;
}

export interface DashboardWorkerOutput {
    stats: any;
    insights: any;
}

export const useDashboardWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const [result, setResult] = useState<DashboardWorkerOutput | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        let worker: Worker;
        try {
            worker = new Worker(new URL('../workers/dashboard.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;
            worker.onmessage = (e: MessageEvent<DashboardWorkerOutput>) => {
                setResult(e.data);
                setIsProcessing(false);
            };
            worker.onerror = () => {
                setIsProcessing(false);
            };
        } catch {
            // Worker not supported in this environment; caller will fallback to main thread
            return;
        }

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    const process = useCallback((input: DashboardWorkerInput) => {
        if (workerRef.current) {
            setIsProcessing(true);
            workerRef.current.postMessage(input);
        }
    }, []);

    return { process, result, isProcessing };
};
