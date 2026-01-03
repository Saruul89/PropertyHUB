// lib/i18n/index.ts
// Translation utility for PropertyHub (Mongolian localization)

import { mn } from './mn';

type TranslationParams = Record<string, string | number>;

/**
 * Get a translated string by key path
 * @param key - Dot-separated key path (e.g., 'common.save', 'billing.total')
 * @param params - Optional parameters for string interpolation
 * @returns Translated string or the key if translation is missing
 *
 * @example
 * t('common.save') // => 'Хадгалах'
 * t('billing.total', { amount: '150,000' }) // => 'Нийт дүн: ₮150,000'
 * t('unit.bulk.willCreate', { count: 10 }) // => '10 өрөө үүсгэнэ'
 */
export function t(key: string, params?: TranslationParams): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = mn;

  for (const k of keys) {
    value = value?.[k];
  }

  if (typeof value !== 'string') {
    console.warn(`Translation missing: ${key}`);
    return key;
  }

  // Parameter substitution
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  return value;
}

/**
 * Check if a translation key exists
 * @param key - Dot-separated key path
 * @returns true if the translation exists
 */
export function hasTranslation(key: string): boolean {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = mn;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return false;
  }

  return typeof value === 'string';
}

/**
 * Get a nested translation object
 * @param key - Dot-separated key path to a translation object
 * @returns The nested translation object or undefined
 */
export function getTranslationObject<T = Record<string, string>>(key: string): T | undefined {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = mn;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return undefined;
  }

  return value as T;
}

// Re-export the translation dictionary for direct access if needed
export { mn };
