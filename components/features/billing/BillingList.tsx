"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Billing, BillingStatus, Tenant, Unit } from "@/types";
import { BillingStatusBadge } from "./BillingStatusBadge";
import {
  Plus,
  Receipt,
  Search,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface BillingWithDetails extends Billing {
  tenant?: Tenant;
  unit?: Unit & { property?: { name: string } };
}

interface BillingListProps {
  showStats?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  propertyId?: string;
  tenantId?: string;
  itemsPerPage?: number;
}

export function BillingList({
  showStats = true,
  showFilters = true,
  showCreateButton = true,
  propertyId,
  tenantId,
  itemsPerPage = 20,
}: BillingListProps) {
  const { companyId } = useAuth();
  const [billings, setBillings] = useState<BillingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (companyId) {
      fetchBillings();
    }
  }, [companyId, currentPage, statusFilter, propertyId, tenantId]);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, search]);

  const fetchBillings = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("billings")
      .select(
        `
                *,
                tenants(*),
                units(*, properties(name))
            `,
        { count: "exact" }
      )
      .eq("company_id", companyId);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (propertyId) {
      query = query.eq("units.property_id", propertyId);
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error, count } = await query
      .order("billing_month", { ascending: false })
      .range(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage - 1);

    if (!error && data) {
      setBillings(
        data.map((b: Record<string, unknown>) => ({
          ...b,
          tenant: b.tenants as Tenant | undefined,
          unit: b.units
            ? {
                ...(b.units as Unit),
                property: (b.units as Record<string, unknown>).properties as
                  | { name: string }
                  | undefined,
              }
            : undefined,
        })) as BillingWithDetails[]
      );
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const filteredBillings = billings.filter((billing) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      billing.tenant?.name.toLowerCase().includes(searchLower) ||
      billing.unit?.unit_number.toLowerCase().includes(searchLower) ||
      billing.billing_number?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: billings.length,
    pending: billings.filter((b) => b.status === "pending").length,
    overdue: billings.filter((b) => b.status === "overdue").length,
    totalAmount: billings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.total_amount, 0),
    paidAmount: billings.reduce((sum, b) => sum + b.paid_amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {showStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                ₮{stats.totalAmount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Нийт нэхэмжилсэн</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                ₮{stats.paidAmount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Нийт төлөгдсөн</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-sm text-gray-500">Төлөгдөөгүй</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <p className="text-sm text-gray-500">Хугацаа хэтэрсэн</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Оршин суугч, өрөөний дугаараар хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as BillingStatus | "all")
                }
              >
                <option value="all">Бүх төлөв</option>
                <option value="pending">Төлөгдөөгүй</option>
                <option value="partial">Хэсэгчлэн төлсөн</option>
                <option value="paid">Төлөгдсөн</option>
                <option value="overdue">Хугацаа хэтэрсэн</option>
                <option value="cancelled">Цуцлагдсан</option>
              </select>
            </div>
          </div>
          {showCreateButton && (
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Экспортлох
              </Button>
              <Link href="/dashboard/billings/generate">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Нэхэмжлэх үүсгэх
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Billings Table */}
      {loading ? (
        <div className="text-center text-gray-500">Ачааллаж байна...</div>
      ) : filteredBillings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-4 text-gray-600">
              {search || statusFilter !== "all"
                ? "Тохирох нэхэмжлэх олдсонгүй"
                : "Нэхэмжлэх байхгүй"}
            </p>
            {!search && statusFilter === "all" && showCreateButton && (
              <Link href="/dashboard/billings/generate">
                <Button>Эхний нэхэмжлэх үүсгэх</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Нэхэмжлэхийн дугаар
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Оршин суугч
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Барилга, өрөө
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Тооцооны сар
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Төлөх хугацаа
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Дүн
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBillings.map((billing) => (
                <tr key={billing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {billing.billing_number || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      {billing.tenant?.name || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p>{billing.unit?.property?.name}</p>
                      <p className="text-gray-500">
                        {billing.unit?.unit_number}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(billing.billing_month).toLocaleDateString(
                      "mn-MN",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(billing.due_date).toLocaleDateString("mn-MN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <p className="font-medium">
                        ₮{billing.total_amount.toLocaleString()}
                      </p>
                      {billing.paid_amount > 0 && (
                        <p className="text-sm text-green-600">
                          Төлсөн: ₮{billing.paid_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <BillingStatusBadge
                      status={billing.status}
                      dueDate={billing.due_date}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/billings/${billing.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Нийт {totalCount}-ээс {currentPage * itemsPerPage + 1} -{" "}
            {Math.min((currentPage + 1) * itemsPerPage, totalCount)} харуулж байна
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Өмнөх
            </Button>
            <span className="px-3 text-sm">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
            >
              Дараах
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
