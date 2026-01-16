"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaseTermsEditor } from "./LeaseTermsEditor";
import { useFeature } from "@/hooks/use-feature";
import { Lease, Tenant, Unit, Property, LeaseTerms } from "@/types";
import { LEASE_STATUS_LABELS, LEASE_STATUS_COLORS } from "@/lib/constants";
import {
  Pencil,
  RefreshCw,
  XCircle,
  Calendar,
  Building,
  User,
} from "lucide-react";

interface LeaseDetailProps {
  lease: Lease & {
    tenant?: Tenant;
    unit?: Unit & { property?: Property };
  };
  onRenew?: () => void;
  onTerminate?: () => void;
}

export function LeaseDetail({ lease, onRenew, onTerminate }: LeaseDetailProps) {
  const hasLeaseManagement = useFeature("lease_management");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("mn-MN");
  };

  const getDaysUntilExpiry = (endDate: string | undefined): number | null => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = lease.end_date
    ? getDaysUntilExpiry(lease.end_date)
    : null;
  const terms = (lease.terms as LeaseTerms) || {};

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/leases/${lease.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            засах
          </Button>
        </Link>
        {lease.status === "active" && onRenew && (
          <Button variant="outline" size="sm" onClick={onRenew}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Сунгах
          </Button>
        )}
        {lease.status === "active" && onTerminate && (
          <Button variant="destructive" size="sm" onClick={onTerminate}>
            <XCircle className="mr-2 h-4 w-4" />
            Дуусгах
          </Button>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Үндсэн мэдээлэл</span>
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                LEASE_STATUS_COLORS[lease.status]
              }`}
            >
              {LEASE_STATUS_LABELS[lease.status]}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Түрээслэгч</p>
                <p className="font-medium">
                  {lease.tenant?.tenant_type === "company"
                    ? lease.tenant.company_name
                    : lease.tenant?.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Барилга/Өрөө</p>
                <p className="font-medium">
                  {lease.unit?.property?.name} / {lease.unit?.unit_number}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Гэрээний хугацаа</p>
                <p className="font-medium">
                  {formatDate(lease.start_date)} 〜{" "}
                  {lease.end_date ? formatDate(lease.end_date) : "Хугацаагүй"}
                </p>
                {daysRemaining !== null && (
                  <p
                    className={`text-sm ${
                      daysRemaining <= 30
                        ? "text-red-500 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    Үлдсэн {daysRemaining} хоног
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Сарын түрээс</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(lease.monthly_rent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Барьцаа</p>
              <p className="font-medium">
                {lease.deposit ? formatCurrency(lease.deposit) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Төлбөрийн хугацаа</p>
              <p className="font-medium">Сар бүрийн {lease.payment_due_day}-нд</p>
            </div>
          </div>
          {lease.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Тэмдэглэл</p>
              <p className="mt-1 whitespace-pre-wrap">{lease.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Terms */}
      {hasLeaseManagement && Object.keys(terms).length > 0 && (
        <LeaseTermsEditor value={terms} onChange={() => {}} readOnly />
      )}
    </div>
  );
}
