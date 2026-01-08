'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCsv } from '@/lib/utils/export-csv';

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

type ColumnConfig<T> = {
  key: keyof T;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any) => string;
};

type ReportExportButtonProps<T extends CsvRow> = {
  data: T[];
  columns: ColumnConfig<T>[];
  filename: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export const ReportExportButton = <T extends CsvRow>({
  data,
  columns,
  filename,
  variant = 'outline',
  size = 'sm',
}: ReportExportButtonProps<T>) => {
  const handleExport = () => {
    exportToCsv(data, columns, filename);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      CSV татах
    </Button>
  );
};
