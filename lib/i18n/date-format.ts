// lib/i18n/date-format.ts
// Date and time formatting utilities for Mongolian locale

/**
 * Month names in Mongolian (short form)
 */
export const monthNames = [
  '1-р сар', // January
  '2-р сар', // February
  '3-р сар', // March
  '4-р сар', // April
  '5-р сар', // May
  '6-р сар', // June
  '7-р сар', // July
  '8-р сар', // August
  '9-р сар', // September
  '10-р сар', // October
  '11-р сар', // November
  '12-р сар', // December
];

/**
 * Month names in Mongolian (full form)
 */
export const monthNamesFull = [
  'Нэгдүгээр сар',
  'Хоёрдугаар сар',
  'Гуравдугаар сар',
  'Дөрөвдүгээр сар',
  'Тавдугаар сар',
  'Зургадугаар сар',
  'Долдугаар сар',
  'Наймдугаар сар',
  'Есдүгээр сар',
  'Аравдугаар сар',
  'Арван нэгдүгээр сар',
  'Арван хоёрдугаар сар',
];

/**
 * Day names in Mongolian
 */
export const dayNames = [
  'Ням', // Sunday
  'Даваа', // Monday
  'Мягмар', // Tuesday
  'Лхагва', // Wednesday
  'Пүрэв', // Thursday
  'Баасан', // Friday
  'Бямба', // Saturday
];

/**
 * Day names in Mongolian (short form)
 */
export const dayNamesShort = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

type DateInput = Date | string | number;

/**
 * Parse a date input into a Date object
 */
function parseDate(date: DateInput): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Pad a number with leading zeros
 */
function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, '0');
}

/**
 * Format a date according to the specified format string
 * @param date - Date to format
 * @param formatStr - Format string (default: 'yyyy.MM.dd')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // => '2024.03.15'
 * formatDate(new Date(), 'yyyy оны MM сарын dd') // => '2024 оны 03 сарын 15'
 * formatDate(new Date(), 'MM сар') // => '03 сар'
 */
export function formatDate(date: DateInput, formatStr: string = 'yyyy.MM.dd'): string {
  const d = parseDate(date);

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const dayOfWeek = d.getDay();

  const replacements: Record<string, string> = {
    yyyy: year.toString(),
    yy: year.toString().slice(-2),
    MMMM: monthNamesFull[month],
    MMM: monthNames[month],
    MM: pad(month + 1),
    M: (month + 1).toString(),
    dd: pad(day),
    d: day.toString(),
    EEEE: dayNames[dayOfWeek],
    EEE: dayNamesShort[dayOfWeek],
    HH: pad(hours),
    H: hours.toString(),
    hh: pad(hours % 12 || 12),
    h: (hours % 12 || 12).toString(),
    mm: pad(minutes),
    m: minutes.toString(),
    ss: pad(seconds),
    s: seconds.toString(),
    a: hours < 12 ? 'AM' : 'PM',
  };

  let result = formatStr;
  // Sort keys by length (descending) to replace longer patterns first
  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    result = result.replace(new RegExp(key, 'g'), replacements[key]);
  }

  return result;
}

/**
 * Format a date in Mongolian style
 * @param date - Date to format
 * @returns Formatted date string (e.g., '2024 оны 03 сарын 15')
 */
export function formatDateMongolian(date: DateInput): string {
  return formatDate(date, 'yyyy оны MM сарын dd');
}

/**
 * Format a date and time
 * @param date - Date to format
 * @returns Formatted date-time string (e.g., '2024.03.15 14:30')
 */
export function formatDateTime(date: DateInput): string {
  return formatDate(date, 'yyyy.MM.dd HH:mm');
}

/**
 * Format a time only
 * @param date - Date to format
 * @returns Formatted time string (e.g., '14:30')
 */
export function formatTime(date: DateInput): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Get the month name for a given date
 * @param date - Date to get month name from
 * @param full - Use full month name (default: false)
 * @returns Month name in Mongolian
 */
export function getMonthName(date: DateInput, full: boolean = false): string {
  const d = parseDate(date);
  return full ? monthNamesFull[d.getMonth()] : monthNames[d.getMonth()];
}

/**
 * Get the day name for a given date
 * @param date - Date to get day name from
 * @param short - Use short day name (default: false)
 * @returns Day name in Mongolian
 */
export function getDayName(date: DateInput, short: boolean = false): string {
  const d = parseDate(date);
  return short ? dayNamesShort[d.getDay()] : dayNames[d.getDay()];
}

/**
 * Format a billing month (year and month)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Formatted billing month (e.g., '2024 оны 3-р сар')
 */
export function formatBillingMonth(year: number, month: number): string {
  return `${year} оны ${monthNames[month - 1]}`;
}

/**
 * Get relative time description
 * @param date - Date to compare
 * @returns Relative time string in Mongolian
 */
export function getRelativeTime(date: DateInput): string {
  const d = parseDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Өнөөдөр';
  if (diffDays === 1) return 'Өчигдөр';
  if (diffDays === -1) return 'Маргааш';
  if (diffDays > 0 && diffDays < 7) return `${diffDays} өдрийн өмнө`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} өдрийн дараа`;
  if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)} долоо хоногийн өмнө`;
  if (diffDays < -7 && diffDays > -30) return `${Math.floor(Math.abs(diffDays) / 7)} долоо хоногийн дараа`;

  return formatDate(d);
}

/**
 * Mongolia timezone (UTC+8)
 */
export const MONGOLIA_TIMEZONE = 'Asia/Ulaanbaatar';

/**
 * Get current date in Mongolia timezone
 * @returns Current date adjusted to Mongolia timezone
 */
export function getMongoliaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: MONGOLIA_TIMEZONE }));
}
