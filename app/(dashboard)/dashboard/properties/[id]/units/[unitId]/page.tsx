"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitStatusBadge, UnitStatusSelect } from "@/components/features/units";
import { TerminateLeaseButton, LeaseCard } from "@/components/features/leases";
import { createClient } from "@/lib/supabase/client";
import type { Unit, Property, Lease, Tenant, UnitStatus } from "@/types";
import { Pencil, Home, Users, Calendar, DollarSign } from "lucide-react";

interface UnitWithProperty extends Unit {
  properties?: Property;
}

interface LeaseWithTenant extends Lease {
  tenants?: Tenant;
}

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const unitId = params.unitId as string;
  const [unit, setUnit] = useState<UnitWithProperty | null>(null);
  const [lease, setLease] = useState<LeaseWithTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: unitData } = await supabase
      .from("units")
      .select("*, properties(*)")
      .eq("id", unitId)
      .single();

    if (!unitData) {
      router.push(`/dashboard/properties/${propertyId}`);
      return;
    }

    setUnit(unitData);

    // アクティブな契約を取得
    const { data: leaseData } = await supabase
      .from("leases")
      .select("*, tenants(*)")
      .eq("unit_id", unitId)
      .eq("status", "active")
      .single();

    setLease(leaseData || null);
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: UnitStatus) => {
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/units/${unitId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setUnit((prev) => (prev ? { ...prev, status: newStatus } : null));
      } else {
        const result = await res.json();
        alert(result.error || "Статус өөрчлөхөд алдаа гарлаа");
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTerminate = async () => {
    if (!lease) return;

    try {
      const res = await fetch(`/api/leases/${lease.id}/terminate`, {
        method: "POST",
      });

      if (res.ok) {
        router.push(`/dashboard/properties/${propertyId}`);
      } else {
        const result = await res.json();
        alert(result.error || "Алдаа гарлаа");
      }
    } catch {
      alert("Алдаа гарлаа");
    }
  };

  if (loading || !unit) {
    return (
      <>
        <Header title="Өрөөний дэлгэрэнгүй" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${unit.properties?.name || ""} - ${unit.unit_number}`}
        showBack
      />
      <div className="p-6 space-y-6">
        {/* 部屋情報カード */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{unit.unit_number}</h1>
                  <p className="text-gray-500">
                    {unit.floor
                      ? `${unit.floor}Давхар`
                      : "Давхарын тоо тохируулаагүй"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UnitStatusBadge status={unit.status} />
                <Link
                  href={`/dashboard/properties/${propertyId}/units/${unitId}/edit`}
                >
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-1 h-4 w-4" />
                    засах
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Талбай</p>
                <p className="text-lg font-semibold">
                  {unit.area_sqm ? `${unit.area_sqm}m²` : "тохируулаагүй"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Өрөөний тоо</p>
                <p className="text-lg font-semibold">
                  {unit.rooms ? `${unit.rooms} өрөө` : "тохируулаагүй"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Сарын түрээс</p>
                <p className="text-lg font-semibold">
                  ₮{unit.monthly_rent.toLocaleString()}
                </p>
              </div>
            </div>

            {unit.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Тэмдэглэл</p>
                <p className="mt-1">{unit.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статус өөрчлөх */}
        <Card>
          <CardHeader>
            <CardTitle>Статус өөрчлөх</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <UnitStatusSelect
                value={unit.status}
                onChange={handleStatusChange}
                disabled={updatingStatus || unit.status === "occupied"}
                className="w-48"
              />
              {unit.status === "occupied" && (
                <p className="text-sm text-gray-500">
                  Эзэмшигчийн өрөө суллах үйлдэл хийгдсэний дараа статус
                  өөрчлөгдөнө
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 現在の入居者情報 */}
        {lease && lease.tenants && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Одоогийн оршин суугч</CardTitle>
                <TerminateLeaseButton
                  leaseId={lease.id}
                  onTerminate={handleTerminate}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{lease.tenants.name}</p>
                    <p className="text-sm text-gray-500">
                      {lease.tenants.phone}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Гэрээ эхэлсэн: {lease.start_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Сарын: ₮{lease.monthly_rent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Баталгаа: ₮{lease.deposit.toLocaleString()}</span>
                  </div>
                </div>

                <Link href={`/dashboard/tenants/${lease.tenants.id}`}>
                  <Button variant="outline" size="sm">
                    Оршин суугчийн дэлгэрэнгүйг харах
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Сул өрөөの場合 */}
        {unit.status === "vacant" && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">Энэ сул өрөө байна</p>
              <Link href="/dashboard/tenants/new">
                <Button>Оршин суугч бүртгэх</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
