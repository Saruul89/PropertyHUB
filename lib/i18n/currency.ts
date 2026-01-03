// lib/i18n/currency.ts
// Currency formatting utilities for Mongolian Tugrik (MNT)

/**
 * Currency symbol for Mongolian Tugrik
 */
export const CURRENCY_SYMBOL = '₮';

/**
 * Currency code
 */
export const CURRENCY_CODE = 'MNT';

/**
 * Format a number as Mongolian Tugrik currency
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., '150,000₮')
 *
 * @example
 * formatCurrency(150000) // => '150,000₮'
 * formatCurrency(1500000) // => '1,500,000₮'
 */
export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('mn-MN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + CURRENCY_SYMBOL
  );
}

/**
 * Format currency with symbol prefix (alternative format)
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., '₮150,000')
 */
export function formatCurrencyPrefix(amount: number): string {
  return (
    CURRENCY_SYMBOL +
    new Intl.NumberFormat('mn-MN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  );
}

/**
 * Format large amounts in shortened form
 * @param amount - Amount to format
 * @returns Shortened currency string
 *
 * @example
 * formatCurrencyShort(1500000) // => '1.5 сая₮'
 * formatCurrencyShort(850000000) // => '850 сая₮'
 * formatCurrencyShort(1500000000) // => '1.5 тэрбум₮'
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000000) {
    const value = amount / 1000000000;
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} тэрбум${CURRENCY_SYMBOL}`;
  }
  if (amount >= 1000000) {
    const value = amount / 1000000;
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} сая${CURRENCY_SYMBOL}`;
  }
  if (amount >= 1000) {
    const value = amount / 1000;
    return `${value.toFixed(0)} мянга${CURRENCY_SYMBOL}`;
  }
  return `${amount}${CURRENCY_SYMBOL}`;
}

/**
 * Format a number with thousand separators
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('mn-MN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a number as a percentage
 * @param num - Number to format (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(num: number, decimals: number = 1): string {
  return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * Parse a currency string back to a number
 * @param value - Currency string to parse
 * @returns Parsed number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol, spaces, and thousand separators
  const cleaned = value.replace(/[₮\s,]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format area in square meters
 * @param area - Area in square meters
 * @returns Formatted area string (e.g., '50.5 м²')
 */
export function formatArea(area: number): string {
  return `${formatNumber(area)} м²`;
}

/**
 * Unit labels in Mongolian
 */
export const unitLabels = {
  sqm: 'м²', // Square meters
  kwh: 'кВт/ц', // Kilowatt-hours
  cbm: 'м³', // Cubic meters
  unit: 'ширхэг', // Units/pieces
  month: 'сар', // Month
  day: 'өдөр', // Day
};
