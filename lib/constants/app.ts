// Timeout constants (in milliseconds)
export const TIMEOUTS = {
    AUTH_CHECK: 1500,
    API_REQUEST: 10000,
    DEBOUNCE: 300,
    TOAST: 5000,
} as const;

// Default values
export const DEFAULTS = {
    LEASE_EXPIRY_WARNING_DAYS: 30,
    PAGINATION_LIMIT: 20,
    BILLING_DUE_DAYS: 15,
    PAYMENT_DUE_DAY: 10,
    MAX_BATCH_SIZE: 50,
    MAX_FILE_SIZE_MB: 10,
} as const;

// Cache durations (in milliseconds)
export const CACHE = {
    STALE_TIME: 5 * 60 * 1000,      // 5 minutes
    GC_TIME: 10 * 60 * 1000,        // 10 minutes
    REFRESH_INTERVAL: 30 * 1000,    // 30 seconds
} as const;

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const;

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'yyyy-MM-dd',
    DISPLAY_WITH_TIME: 'yyyy-MM-dd HH:mm',
    MONTH: 'yyyy-MM',
    API: 'yyyy-MM-dd',
} as const;

// Currency
export const CURRENCY = {
    DEFAULT: 'MNT',
    SYMBOL: '₮',
    LOCALE: 'mn-MN',
} as const;

// Validation limits
export const LIMITS = {
    NAME_MIN: 2,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 500,
    PHONE_MIN: 8,
    PHONE_MAX: 15,
    PASSWORD_MIN: 8,
} as const;
