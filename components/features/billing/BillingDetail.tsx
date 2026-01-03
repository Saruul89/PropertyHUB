"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Billing,
  BillingItem,
  Payment,
  Tenant,
  Unit,
  PaymentMethod,
} from "@/types";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import {
  Receipt,
  User,
  Home,
  Calendar,
  CreditCard,
  Printer,
  CheckCircle,
  FileText,
} from "lucide-react";

interface BillingWithDetails extends Billing {
  tenant?: Tenant;
  unit?: Unit & { property?: { name: string; address?: string } };
}

interface BillingDetailProps {
  billingId: string;
  showActions?: boolean;
  onPaymentRecorded?: () => void;
}

export function BillingDetail({
  billingId,
  showActions = true,
  onPaymentRecorded,
}: BillingDetailProps) {
  const [billing, setBilling] = useState<BillingWithDetails | null>(null);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchBillingDetails();
  }, [billingId]);

  const fetchBillingDetails = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: billingData, error: billingError } = await supabase
      .from("billings")
      .select(
        `
                *,
                tenants(*),
                units(*, properties(name, address))
            `
      )
      .eq("id", billingId)
      .single();

    if (billingError || !billingData) {
      setLoading(false);
      return;
    }

    setBilling({
      ...billingData,
      tenant: billingData.tenants,
      unit: billingData.units
        ? {
            ...billingData.units,
            property: billingData.units.properties,
          }
        : undefined,
    });

    const { data: itemsData } = await supabase
      .from("billing_items")
      .select("*")
      .eq("billing_id", billingId)
      .order("created_at");

    if (itemsData) {
      setBillingItems(itemsData);
    }

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("billing_id", billingId)
      .order("payment_date", { ascending: false });

    if (paymentsData) {
      setPayments(paymentsData);
    }

    setLoading(false);
  };

  const handlePaymentRecorded = () => {
    fetchBillingDetails();
    setShowPaymentForm(false);
    onPaymentRecorded?.();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Ачааллаж байна...</div>;
  }

  if (!billing) {
    return (
      <div className="text-center text-gray-500">請求が見つかりません</div>
    );
  }

  const remainingAmount = billing.total_amount - billing.paid_amount;
  const isPaid = billing.status === "paid";

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {billing.billing_number || "請求書"}
            </h2>
            <p className="text-gray-500">
              {new Date(billing.billing_month).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
              })}
              の請求
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              印刷
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            {!isPaid && (
              <Button onClick={() => setShowPaymentForm(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                支払いを記録
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status Banner */}
      {isPaid && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">支払い完了</p>
            <p className="text-sm text-green-600">
              {billing.paid_at &&
                new Date(billing.paid_at).toLocaleDateString("ja-JP")}
              に支払い完了
            </p>
          </div>
        </div>
      )}

      {/* Billing Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              入居者情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{billing.tenant?.name}</p>
            <p className="text-sm text-gray-500">{billing.tenant?.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" />
              物件情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{billing.unit?.property?.name}</p>
            <p className="text-sm text-gray-500">
              өрөөний дугаар: {billing.unit?.unit_number}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            請求明細
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  項目
                </th>
                <th className="pb-2 text-right text-sm font-medium text-gray-500">
                  数量
                </th>
                <th className="pb-2 text-right text-sm font-medium text-gray-500">
                  単価
                </th>
                <th className="pb-2 text-right text-sm font-medium text-gray-500">
                  金額
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {billingItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="font-medium">{item.fee_name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">
                    ₮{item.unit_price.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-medium">
                    ₮{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t">
              <tr>
                <td colSpan={3} className="py-3 text-right font-medium">
                  小計
                </td>
                <td className="py-3 text-right font-medium">
                  ₮{billing.subtotal.toLocaleString()}
                </td>
              </tr>
              {billing.tax_amount > 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-right font-medium">
                    税額
                  </td>
                  <td className="py-3 text-right font-medium">
                    ₮{billing.tax_amount.toLocaleString()}
                  </td>
                </tr>
              )}
              <tr className="text-lg">
                <td colSpan={3} className="py-3 text-right font-bold">
                  合計
                </td>
                <td className="py-3 text-right font-bold">
                  ₮{billing.total_amount.toLocaleString()}
                </td>
              </tr>
              {billing.paid_amount > 0 && (
                <>
                  <tr className="text-green-600">
                    <td colSpan={3} className="py-3 text-right font-medium">
                      支払済み
                    </td>
                    <td className="py-3 text-right font-medium">
                      -₮{billing.paid_amount.toLocaleString()}
                    </td>
                  </tr>
                  {remainingAmount > 0 && (
                    <tr className="text-red-600">
                      <td colSpan={3} className="py-3 text-right font-bold">
                        未払い残高
                      </td>
                      <td className="py-3 text-right font-bold">
                        ₮{remainingAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Payment History */}
      <PaymentHistory payments={payments} />

      {/* Due Date Info */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">支払期限</p>
            <p className="font-medium">
              {new Date(billing.due_date).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <div className="ml-4">
            <BillingStatusBadge
              status={billing.status}
              dueDate={billing.due_date}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Modal */}
      {showPaymentForm && billing && (
        <PaymentForm
          billing={billing}
          onClose={() => setShowPaymentForm(false)}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}
