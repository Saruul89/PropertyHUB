// lib/i18n/phone.ts
// Phone number formatting utilities for Mongolia (8-digit format)

/**
 * Mongolia country code
 */
export const COUNTRY_CODE = '+976';

/**
 * Phone number length in Mongolia
 */
export const PHONE_LENGTH = 8;

/**
 * Phone placeholder for input fields
 */
export const phonePlaceholder = '9900-1234';

/**
 * Format a phone number in Mongolian format (xxxx-xxxx)
 * @param phone - Phone number to format
 * @returns Formatted phone number
 *
 * @example
 * formatPhone('99001234') // => '9900-1234'
 * formatPhone('9900-1234') // => '9900-1234'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Remove country code if present
  const number = cleaned.startsWith('976') ? cleaned.slice(3) : cleaned;

  if (number.length === PHONE_LENGTH) {
    return `${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return number;
}

/**
 * Format a phone number with country code
 * @param phone - Phone number to format
 * @returns Formatted phone number with country code
 *
 * @example
 * formatPhoneWithCountryCode('99001234') // => '+976 9900-1234'
 */
export function formatPhoneWithCountryCode(phone: string): string {
  const formatted = formatPhone(phone);
  return `${COUNTRY_CODE} ${formatted}`;
}

/**
 * Validate a Mongolian phone number
 * @param phone - Phone number to validate
 * @returns true if the phone number is valid
 *
 * @example
 * isValidPhone('99001234') // => true
 * isValidPhone('1234567') // => false
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');

  // Remove country code if present
  const number = cleaned.startsWith('976') ? cleaned.slice(3) : cleaned;

  // Must be exactly 8 digits
  if (number.length !== PHONE_LENGTH) {
    return false;
  }

  // Common Mongolian mobile prefixes
  const validPrefixes = ['88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

  // Landline prefixes (Ulaanbaatar and provincial)
  const landlinePrefixes = ['11', '21', '22', '23', '24', '25', '26', '27', '70', '71', '72', '75', '76', '77'];

  const prefix = number.slice(0, 2);

  return validPrefixes.includes(prefix) || landlinePrefixes.includes(prefix);
}

/**
 * Clean a phone number by removing all non-digit characters
 * @param phone - Phone number to clean
 * @returns Cleaned phone number (digits only)
 */
export function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // Remove country code if present
  return cleaned.startsWith('976') ? cleaned.slice(3) : cleaned;
}

/**
 * Get phone number type
 * @param phone - Phone number to check
 * @returns 'mobile', 'landline', or 'unknown'
 */
export function getPhoneType(phone: string): 'mobile' | 'landline' | 'unknown' {
  const cleaned = cleanPhone(phone);

  if (cleaned.length !== PHONE_LENGTH) {
    return 'unknown';
  }

  const prefix = cleaned.slice(0, 2);

  const mobilePrefixes = ['88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

  if (mobilePrefixes.includes(prefix)) {
    return 'mobile';
  }

  const landlinePrefixes = ['11', '21', '22', '23', '24', '25', '26', '27', '70', '71', '72', '75', '76', '77'];

  if (landlinePrefixes.includes(prefix)) {
    return 'landline';
  }

  return 'unknown';
}

/**
 * Phone input pattern for HTML input validation
 */
export const phonePattern = '[0-9]{4}-?[0-9]{4}';

/**
 * Phone regex for validation
 */
export const phoneRegex = /^[0-9]{8}$/;

/**
 * Phone regex with formatting
 */
export const phoneRegexFormatted = /^[0-9]{4}-[0-9]{4}$/;
