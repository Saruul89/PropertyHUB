/**
 * Converts an array of objects to CSV format and triggers a download
 * Handles Mongolian text encoding with UTF-8 BOM
 */

type CsvValue = string | number | boolean | null | undefined;

type CsvRow = Record<string, CsvValue>;

type ColumnConfig<T> = {
  key: keyof T;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any) => string;
};

export const exportToCsv = <T extends CsvRow>(
  data: T[],
  columns: ColumnConfig<T>[],
  filename: string
): void => {
  if (data.length === 0) {
    return;
  }

  // Create header row
  const headerRow = columns.map((col) => escapeCell(col.header)).join(',');

  // Create data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        if (col.formatter) {
          return escapeCell(col.formatter(value));
        }
        return escapeCell(formatValue(value));
      })
      .join(',');
  });

  // Combine all rows
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Add UTF-8 BOM for proper encoding of Mongolian text
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCell = (value: string): string => {
  // If value contains comma, newline, or quote, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const formatValue = (value: CsvValue): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Тийм' : 'Үгүй';
  }
  return String(value);
};

// Helper to format currency for CSV
export const formatCurrencyForCsv = (value: number): string => {
  return `₮${value.toLocaleString()}`;
};

// Helper to format percentage for CSV
export const formatPercentForCsv = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Helper to format date for CSV
export const formatDateForCsv = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('mn-MN');
};
