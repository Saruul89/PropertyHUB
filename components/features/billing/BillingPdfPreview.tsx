"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Billing, BillingItem, Tenant, Unit, Company } from "@/types";
import { Printer, Download } from "lucide-react";

interface BillingPdfPreviewProps {
  billing: Billing;
  billingItems: BillingItem[];
  tenant?: Tenant;
  unit?: Unit & { property?: { name: string; address?: string } };
  company?: Partial<Company>;
}

export function BillingPdfPreview({
  billing,
  billingItems,
  tenant,
  unit,
  company,
}: BillingPdfPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Нэхэмжлэх</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
            body { font-family: sans-serif; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-left, .info-right { width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
            th { background: #f9f9f9; }
            .amount { text-align: right; }
            .total { font-weight: bold; font-size: 1.2em; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        `);
    printWindow.document.write("</style></head><body>");
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Хэвлэх
        </Button>
      </div>

      <div
        ref={printRef}
        className="rounded-lg border bg-white p-8"
        style={{ minHeight: "842px" }}
      >
        <div className="invoice">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">НЭХЭМЖЛЭХ</h1>
            <p className="mt-2 text-gray-500">
              Нэхэмжлэхийн дугаар: {billing.billing_number}
            </p>
          </div>

          {/* Info Section */}
          <div className="mb-8 flex justify-between">
            <div className="w-1/2">
              <p className="mb-2 text-sm text-gray-500">Нэхэмжлэгч</p>
              <p className="text-lg font-medium">{tenant?.name}</p>
              {unit && (
                <p className="text-gray-600">
                  {unit.property?.name} {unit.unit_number}
                </p>
              )}
            </div>
            <div className="w-1/3 text-right">
              <p className="mb-2 text-sm text-gray-500">Үүсгэгч</p>
              <p className="font-medium">{company?.name || "Удирдлагын компани"}</p>
              {company?.address && (
                <p className="text-sm text-gray-600">{company.address}</p>
              )}
              {company?.phone && (
                <p className="text-sm text-gray-600">Утас: {company.phone}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mb-8 flex gap-8">
            <div>
              <p className="text-sm text-gray-500">Тухайн сар</p>
              <p className="font-medium">
                {formatMonth(billing.billing_month)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Үүсгэсэн огноо</p>
              <p className="font-medium">{formatDate(billing.issue_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Төлбөрийн хугацаа</p>
              <p className="font-medium">{formatDate(billing.due_date)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="mb-8 w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="pb-3 text-left text-sm font-medium text-gray-600">
                  Нэр
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600">
                  Тоо ширхэг
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600">
                  Нэгж үнэ
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600">
                  Дүн
                </th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">
                    <p>{item.fee_name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {item.quantity !== 1 ? item.quantity.toLocaleString() : ""}
                  </td>
                  <td className="py-3 text-right">
                    ₮{item.unit_price.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-medium">
                    ₮{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={3} className="py-3 text-right font-medium">
                  Дэд дүн
                </td>
                <td className="py-3 text-right font-medium">
                  ₮{billing.subtotal.toLocaleString()}
                </td>
              </tr>
              {billing.tax_amount > 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-right font-medium">
                    Татвар
                  </td>
                  <td className="py-3 text-right font-medium">
                    ₮{billing.tax_amount.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr className="text-xl">
                <td colSpan={3} className="py-4 text-right font-bold">
                  Нийт
                </td>
                <td className="py-4 text-right font-bold">
                  ₮{billing.total_amount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-2 font-medium">
              Төлбөрийн хугацаа: {formatDate(billing.due_date)}
            </p>
            <p className="text-sm text-gray-600">
              Дээрх дүнг хугацаанд нь төлнө үү.
            </p>
          </div>

          {/* Notes */}
          {billing.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Тэмдэглэл</p>
              <p className="text-gray-700">{billing.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
