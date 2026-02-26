// ============================================
// Error Boundary - حدود الأخطاء المخصصة
// Al-Zahra Smart ERP
// ============================================

import React, { Component, ReactNode } from 'react';
import { AppError, ErrorCode, UnknownRecord } from '../types/common';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: AppError, errorInfo: UnknownRecord) => void;
    resetKeys?: unknown[];
}

interface State {
    hasError: boolean;
    error: AppError | null;
}

/**
 * Error Boundary Component
 * catches React errors and displays fallback UI
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        const appError = error instanceof AppError
            ? error
            : new AppError(error.message, ErrorCode.UNKNOWN, 500);

        return { hasError: true, error: appError };
    }

    componentDidCatch(error: Error, errorInfo: UnknownRecord) {
        const appError = error instanceof AppError
            ? error
            : new AppError(error.message, ErrorCode.UNKNOWN, 500);

        console.error('[ErrorBoundary] Caught error:', appError, errorInfo);

        this.props.onError?.(appError, errorInfo);
    }

    componentDidUpdate(prevProps: Props) {
        // Reset error state when resetKeys change
        if (this.props.resetKeys && prevProps.resetKeys) {
            const hasResetKeyChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );

            if (hasResetKeyChanged && this.state.hasError) {
                this.setState({ hasError: false, error: null });
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600 dark:text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-800 dark:text-red-400">
                                    حدث خطأ
                                </h2>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    يرجى إعادة المحاولة
                                </p>
                            </div>
                        </div>

                        {this.state.error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {this.state.error.message}
                                </p>
                                {import.meta.env.DEV && (
                                    <p className="text-xs text-red-500 mt-2 font-mono">
                                        {this.state.error.code}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                            >
                                إعادة تحميل الصفحة
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook for using Error Boundary functionality in functional components
 */
import { useState, useCallback } from 'react';

export const useErrorBoundary = () => {
    const [error, setError] = useState<AppError | null>(null);

    const showError = useCallback((appError: AppError) => {
        setError(appError);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { error, showError, clearError };
};

export default ErrorBoundary;
