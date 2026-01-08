type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
    debug: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.debug(formatMessage('debug', message, context));
        }
    },

    info: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.info(formatMessage('info', message, context));
        }
    },

    warn: (message: string, context?: LogContext) => {
        if (isDevelopment) {
            console.warn(formatMessage('warn', message, context));
        }
    },

    error: (message: string, error?: unknown, context?: LogContext) => {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : error,
        };

        if (isDevelopment) {
            console.error(formatMessage('error', message, errorContext));
        }

        // TODO: 本番環境ではSentryなどの外部サービスに送信
        // if (!isDevelopment && typeof window !== 'undefined') {
        //     Sentry.captureException(error, { extra: context });
        // }
    },
};

export default logger;
