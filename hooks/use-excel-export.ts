import { useCallback } from 'react';
import * as XLSX from 'xlsx';

export type ExcelColumn<T> = {
  header: string;
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
  width?: number;
};

type ExportOptions = {
  filename: string;
  sheetName?: string;
};

export const useExcelExport = <T extends Record<string, unknown>>() => {
  const exportToExcel = useCallback(
    (data: T[], columns: ExcelColumn<T>[], options: ExportOptions): void => {
      const { filename, sheetName = 'Sheet1' } = options;

      // Transform data based on columns
      const headers = columns.map((col) => col.header);
      const rows = data.map((row) =>
        columns.map((col) => {
          if (typeof col.accessor === 'function') {
            return col.accessor(row) ?? '';
          }
          return row[col.accessor] ?? '';
        })
      );

      // Create worksheet data
      const worksheetData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
      ws['!cols'] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);

      // Generate filename with date
      const dateStr = new Date().toISOString().slice(0, 10);
      const fullFilename = `${filename}-${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fullFilename);
    },
    []
  );

  return { exportToExcel };
};

// Pre-configured export functions for common data types
export const useTenantExport = () => {
  const { exportToExcel } = useExcelExport();

  const exportTenants = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tenants: any[]) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        { header: 'Нэр', accessor: 'name', width: 20 },
        { header: 'Утас', accessor: 'phone', width: 15 },
        { header: 'Имэйл', accessor: 'email', width: 25 },
        {
          header: 'Төрөл',
          accessor: (row) =>
            row.type === 'individual' ? 'Хувь хүн' : 'Компани',
          width: 12,
        },
        {
          header: 'Барилга',
          accessor: (row) => {
            const units = row.units as { property?: { name?: string } }[] | undefined;
            return units?.[0]?.property?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Өрөө',
          accessor: (row) => {
            const units = row.units as { unit_number?: string }[] | undefined;
            return units?.map((u) => u.unit_number).join(', ') || '-';
          },
          width: 15,
        },
        {
          header: 'Бүртгэсэн огноо',
          accessor: (row) =>
            row.created_at
              ? new Date(row.created_at as string).toLocaleDateString('mn-MN')
              : '-',
          width: 15,
        },
      ];

      exportToExcel(tenants, columns, {
        filename: 'tenants',
        sheetName: 'Оршин суугчид',
      });
    },
    [exportToExcel]
  );

  return { exportTenants };
};

export const useLeaseExport = () => {
  const { exportToExcel } = useExcelExport();

  const exportLeases = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (leases: any[]) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        {
          header: 'Түрээслэгч',
          accessor: (row) => {
            const tenant = row.tenant as { name?: string } | undefined;
            return tenant?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Барилга',
          accessor: (row) => {
            const unit = row.unit as {
              property?: { name?: string };
            } | undefined;
            return unit?.property?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Өрөө',
          accessor: (row) => {
            const unit = row.unit as { unit_number?: string } | undefined;
            return unit?.unit_number || '-';
          },
          width: 12,
        },
        {
          header: 'Эхлэх огноо',
          accessor: (row) =>
            row.start_date
              ? new Date(row.start_date as string).toLocaleDateString('mn-MN')
              : '-',
          width: 15,
        },
        {
          header: 'Дуусах огноо',
          accessor: (row) =>
            row.end_date
              ? new Date(row.end_date as string).toLocaleDateString('mn-MN')
              : '-',
          width: 15,
        },
        {
          header: 'Сарын түрээс',
          accessor: (row) => {
            const rent = row.monthly_rent as number | undefined;
            return rent ? `₮${rent.toLocaleString()}` : '-';
          },
          width: 18,
        },
        {
          header: 'Төлөв',
          accessor: (row): string => {
            const statusMap: Record<string, string> = {
              active: 'Идэвхтэй',
              pending: 'Хүлээгдэж буй',
              expired: 'Дууссан',
              terminated: 'Цуцалсан',
            };
            const status = row.status as string;
            return statusMap[status] || status || '-';
          },
          width: 15,
        },
      ];

      exportToExcel(leases, columns, {
        filename: 'leases',
        sheetName: 'Гэрээнүүд',
      });
    },
    [exportToExcel]
  );

  return { exportLeases };
};

export const useBillingExport = () => {
  const { exportToExcel } = useExcelExport();

  const exportBillings = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (billings: any[]) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        { header: 'Нэхэмжлэхийн дугаар', accessor: 'billing_number', width: 18 },
        {
          header: 'Оршин суугч',
          accessor: (row) => {
            const tenant = row.tenant as { name?: string } | undefined;
            return tenant?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Барилга',
          accessor: (row) => {
            const unit = row.unit as {
              property?: { name?: string };
            } | undefined;
            return unit?.property?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Өрөө',
          accessor: (row) => {
            const unit = row.unit as { unit_number?: string } | undefined;
            return unit?.unit_number || '-';
          },
          width: 12,
        },
        {
          header: 'Нэхэмжлэлийн сар',
          accessor: (row) =>
            row.billing_month
              ? new Date(row.billing_month as string).toLocaleDateString('mn-MN', {
                  year: 'numeric',
                  month: 'short',
                })
              : '-',
          width: 15,
        },
        {
          header: 'Хугацаа',
          accessor: (row) =>
            row.due_date
              ? new Date(row.due_date as string).toLocaleDateString('mn-MN')
              : '-',
          width: 15,
        },
        {
          header: 'Нийт дүн',
          accessor: (row) => {
            const amount = row.total_amount as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '-';
          },
          width: 18,
        },
        {
          header: 'Төлсөн',
          accessor: (row) => {
            const amount = row.paid_amount as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '₮0';
          },
          width: 18,
        },
        {
          header: 'Төлөв',
          accessor: (row): string => {
            const statusMap: Record<string, string> = {
              pending: 'Төлөгдөөгүй',
              partial: 'Хэсэгчлэн',
              paid: 'Төлөгдсөн',
              overdue: 'Хэтэрсэн',
              cancelled: 'Цуцлагдсан',
            };
            const status = row.status as string;
            return statusMap[status] || status || '-';
          },
          width: 15,
        },
      ];

      exportToExcel(billings, columns, {
        filename: 'billings',
        sheetName: 'Нэхэмжлэлүүд',
      });
    },
    [exportToExcel]
  );

  return { exportBillings };
};

export const useMeterReadingExport = () => {
  const { exportToExcel } = useExcelExport();

  const exportMeterReadings = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (readings: any[]) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        {
          header: 'Барилга',
          accessor: (row) => {
            const unit = row.unit as {
              property?: { name?: string };
            } | undefined;
            return unit?.property?.name || '-';
          },
          width: 20,
        },
        {
          header: 'Өрөө',
          accessor: (row) => {
            const unit = row.unit as { unit_number?: string } | undefined;
            return unit?.unit_number || '-';
          },
          width: 12,
        },
        {
          header: 'Төлбөрийн төрөл',
          accessor: (row) => {
            const feeType = row.fee_type as { name?: string } | undefined;
            return feeType?.name || '-';
          },
          width: 18,
        },
        {
          header: 'Бүртгэсэн огноо',
          accessor: (row) =>
            row.reading_date
              ? new Date(row.reading_date as string).toLocaleDateString('mn-MN')
              : '-',
          width: 15,
        },
        { header: 'Өмнөх заалт', accessor: 'previous_reading', width: 12 },
        { header: 'Одоогийн заалт', accessor: 'current_reading', width: 14 },
        { header: 'Хэрэглээ', accessor: 'consumption', width: 12 },
        {
          header: 'Дүн',
          accessor: (row) => {
            const amount = row.total_amount as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '-';
          },
          width: 15,
        },
      ];

      exportToExcel(readings, columns, {
        filename: 'meter-readings',
        sheetName: 'Тоолуур бүртгэл',
      });
    },
    [exportToExcel]
  );

  return { exportMeterReadings };
};

export const useReportExport = () => {
  const { exportToExcel } = useExcelExport();

  const exportPropertyReport = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any[], month: string) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        { header: 'Барилгын нэр', accessor: 'property_name', width: 25 },
        { header: 'Нийт өрөө', accessor: 'total_units', width: 12 },
        {
          header: 'Нийт нэхэмжлэл',
          accessor: (row) => {
            const amount = row.total_billed as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '-';
          },
          width: 18,
        },
        {
          header: 'Төлөгдсөн',
          accessor: (row) => {
            const amount = row.total_paid as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '₮0';
          },
          width: 18,
        },
        {
          header: 'Цуглуулалтын хувь',
          accessor: (row) => {
            const rate = row.collection_rate as number | undefined;
            return rate !== undefined ? `${rate.toFixed(1)}%` : '-';
          },
          width: 18,
        },
      ];

      exportToExcel(data, columns, {
        filename: `property-report-${month}`,
        sheetName: 'Барилгын тайлан',
      });
    },
    [exportToExcel]
  );

  const exportOverdueReport = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any[], month: string) => {
      const columns: ExcelColumn<Record<string, unknown>>[] = [
        { header: 'Оршин суугч', accessor: 'tenant_name', width: 20 },
        { header: 'Барилга', accessor: 'property_name', width: 20 },
        { header: 'Өрөө', accessor: 'unit_number', width: 12 },
        {
          header: 'Үлдэгдэл дүн',
          accessor: (row) => {
            const amount = row.outstanding_amount as number | undefined;
            return amount ? `₮${amount.toLocaleString()}` : '-';
          },
          width: 18,
        },
        { header: 'Хоцорсон хоног', accessor: 'days_overdue', width: 15 },
      ];

      exportToExcel(data, columns, {
        filename: `overdue-report-${month}`,
        sheetName: 'Хугацаа хэтэрсэн',
      });
    },
    [exportToExcel]
  );

  return { exportPropertyReport, exportOverdueReport };
};
