"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Billing, BillingStatus } from "@/types";
import {
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

export interface BillingHistoryProps {
  leaseId: string;
}

const statusConfig: Record<
  BillingStatus,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    label: "Төлөөгүй",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  partial: {
    label: "Хэсэгчлэн төлөх",
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  paid: {
    label: "Төлөгдсөн",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  overdue: {
    label: "Хэтэрсэн",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "Цуцлагдсан",
    icon: XCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("mn-MN");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("mn-MN").format(amount);
};

const formatMonth = (billingMonth: string) => {
  const [year, month] = billingMonth.split("-");
  return `${year} жил ${parseInt(month)} сар`;
};

export function BillingHistory({ leaseId }: BillingHistoryProps) {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillings();
  }, [leaseId]);

  const fetchBillings = async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from("billings")
      .select("*")
      .eq("lease_id", leaseId)
      .order("billing_month", { ascending: false })
      .limit(12);

    setBillings(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Нэхэмжлэх илгээсэн түүх
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Ачааллаж байна...</div>
        </CardContent>
      </Card>
    );
  }

  if (billings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Нэхэмжлэх илгээсэн түүх
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Нэхэмжлэхийн түүх байхгүй байна
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Нэхэмжлэх илгээсэн түүх
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {billings.map((billing) => {
            const status = statusConfig[billing.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={billing.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${status.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatMonth(billing.billing_month)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Үүсгэсэн өдөр: {formatDate(billing.issue_date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ¥{formatCurrency(billing.total_amount)}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
