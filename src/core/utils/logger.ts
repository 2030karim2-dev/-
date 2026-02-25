/**
 * Unified Logger System for Al-Zahra Smart ERP
 * Replaces scattered console.log/warn/error calls with a centralized, configurable logger
 * 
 * Usage:
 *   import { logger } from '@/core/utils/logger';
 *   logger.info('Auth', 'User logged in', { userId: '123' });
 *   logger.error('API', 'Failed to fetch data', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enabled: boolean;
    minLevel: LogLevel;
    includeTimestamp: boolean;
    remoteLogging: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

class Logger {
    private config: LoggerConfig = {
        enabled: !import.meta.env.PROD,
        minLevel: import.meta.env.PROD ? 'error' : 'debug',
        includeTimestamp: true,
        remoteLogging: false,
    };

    /**
     * Configure the logger
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Check if a log level should be displayed
     */
    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
    }

    /**
     * Format the log prefix
     */
    private formatPrefix(level: LogLevel, context: string): string {
        const parts: string[] = [];

        if (this.config.includeTimestamp) {
            parts.push(`[${new Date().toISOString()}]`);
        }

        parts.push(`[${level.toUpperCase()}]`);
        parts.push(`[${context}]`);

        return parts.join(' ');
    }

    /**
     * Log a debug message (development only)
     */
    debug(context: string, message: string, data?: unknown): void {
        if (!this.shouldLog('debug')) return;

        const prefix = this.formatPrefix('debug', context);
        if (data !== undefined) {
            console.debug(`${LOG_COLORS.debug}${prefix}${RESET_COLOR}`, message, data);
        } else {
            console.debug(`${LOG_COLORS.debug}${prefix}${RESET_COLOR}`, message);
        }
    }

    /**
     * Log an info message
     */
    info(context: string, message: string, data?: unknown): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.formatPrefix('info', context);
        if (data !== undefined) {
            console.info(`${LOG_COLORS.info}${prefix}${RESET_COLOR}`, message, data);
        } else {
            console.info(`${LOG_COLORS.info}${prefix}${RESET_COLOR}`, message);
        }
    }

    /**
     * Log a warning message
     */
    warn(context: string, message: string, data?: unknown): void {
        if (!this.shouldLog('warn')) return;

        const prefix = this.formatPrefix('warn', context);
        if (data !== undefined) {
            console.warn(`${LOG_COLORS.warn}${prefix}${RESET_COLOR}`, message, data);
        } else {
            console.warn(`${LOG_COLORS.warn}${prefix}${RESET_COLOR}`, message);
        }
    }

    /**
     * Log an error message
     */
    error(context: string, message: string, error?: unknown): void {
        if (!this.shouldLog('error')) return;

        const prefix = this.formatPrefix('error', context);

        // Extract error details
        const errorDetails = error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error;

        console.error(`${LOG_COLORS.error}${prefix}${RESET_COLOR}`, message, errorDetails);

        // Send to remote logging service if configured
        if (this.config.remoteLogging) {
            this.sendToRemote('error', context, message, errorDetails);
        }
    }

    /**
     * Log a performance timing
     */
    time(context: string, label: string): void {
        if (!this.shouldLog('debug')) return;
        console.time(`[${context}] ${label}`);
    }

    /**
     * End a performance timing
     */
    timeEnd(context: string, label: string): void {
        if (!this.shouldLog('debug')) return;
        console.timeEnd(`[${context}] ${label}`);
    }

    /**
     * Create a child logger with a fixed context
     */
    child(context: string): ContextLogger {
        return new ContextLogger(this, context);
    }

    /**
     * Send logs to a remote logging service (placeholder for future implementation)
     */
    private async sendToRemote(level: LogLevel, context: string, message: string, data?: unknown): Promise<void> {
        try {
            // Placeholder: Implement remote logging (e.g., Sentry, LogRocket, custom endpoint)
            // await fetch('/api/logs', {
            //   method: 'POST',
            //   body: JSON.stringify({ level, context, message, data, timestamp: new Date().toISOString() }),
            // });
        } catch (err) {
            // Silently fail to avoid infinite loops
        }
    }
}

/**
 * Context logger that pre-binds a context
 */
class ContextLogger {
    constructor(private logger: Logger, private context: string) { }

    debug(message: string, data?: unknown): void {
        this.logger.debug(this.context, message, data);
    }

    info(message: string, data?: unknown): void {
        this.logger.info(this.context, message, data);
    }

    warn(message: string, data?: unknown): void {
        this.logger.warn(this.context, message, data);
    }

    error(message: string, error?: unknown): void {
        this.logger.error(this.context, message, error);
    }

    time(label: string): void {
        this.logger.time(this.context, label);
    }

    timeEnd(label: string): void {
        this.logger.timeEnd(this.context, label);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LoggerConfig };
