"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Tenant, Unit, Property } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const leaseSchema = z.object({
  tenant_id: z.string().min(1, "Оршин суугчийг сонгоно уу"),
  unit_id: z.string().min(1, "Өрөөг сонгоно уу"),
  start_date: z.string().min(1, "Эхлэх огноо шаардлагатай"),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0, "Сарын түрээс 0-с дээш байх ёстой"),
  deposit: z.number().min(0, "Барьцаа 0-с дээш байх ёстой"),
  payment_due_day: z
    .number()
    .min(1)
    .max(28, "Төлөх өдөр 1-28 хооронд байх ёстой"),
  notes: z.string().optional(),
});

type LeaseFormData = z.infer<typeof leaseSchema>;

interface UnitWithProperty extends Unit {
  property: Property;
}

export default function NewLeasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTenantId = searchParams.get("tenant_id");
  const preselectedUnitId = searchParams.get("unit_id");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<UnitWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenant_id: preselectedTenantId || "",
      unit_id: preselectedUnitId || "",
      start_date: new Date().toISOString().split("T")[0],
      monthly_rent: 0,
      deposit: 0,
      payment_due_day: 1,
    },
  });

  const selectedUnitId = watch("unit_id");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update rent when unit is selected
    const unit = units.find((u) => u.id === selectedUnitId);
    if (unit) {
      setValue("monthly_rent", unit.monthly_rent || 0);
    }
  }, [selectedUnitId, units, setValue]);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.user.id)
      .single();

    if (!companyUser) return;

    // Fetch tenants without active leases
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("name");

    // Fetch properties
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("name");

    // Fetch vacant units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*, property:properties(*)")
      .eq("status", "vacant")
      .in(
        "property_id",
        (propertiesData || []).map((p: Property) => p.id)
      );

    setTenants(tenantsData || []);
    setProperties(propertiesData || []);
    setUnits((unitsData as UnitWithProperty[]) || []);
    setFetching(false);
  };

  const filteredUnits = selectedProperty
    ? units.filter((u) => u.property_id === selectedProperty)
    : units;

  const onSubmit = async (data: LeaseFormData) => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.user.id)
      .single();

    if (!companyUser) return;

    // Check if tenant already has active lease
    const { data: existingLease } = await supabase
      .from("leases")
      .select("id")
      .eq("tenant_id", data.tenant_id)
      .eq("status", "active")
      .single();

    if (existingLease) {
      setError("Энэ оршин суугч аль хэдийн идэвхтэй гэрээтэй байна");
      setLoading(false);
      return;
    }

    // Create lease
    const { error: leaseError } = await supabase.from("leases").insert({
      tenant_id: data.tenant_id,
      unit_id: data.unit_id,
      company_id: companyUser.company_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      monthly_rent: data.monthly_rent,
      deposit: data.deposit,
      payment_due_day: data.payment_due_day,
      status: "active",
      notes: data.notes || null,
    });

    if (leaseError) {
      setError(leaseError.message);
      setLoading(false);
      return;
    }

    // Update unit status to occupied
    await supabase
      .from("units")
      .update({ status: "occupied" })
      .eq("id", data.unit_id);

    router.push("/dashboard/leases");
  };

  if (fetching) {
    return (
      <>
        <Header title="Шинэ гэрээ" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Шинэ гэрээ" showBack />
      <div className="p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Гэрээний мэдээлэл оруулах</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tenant Selection */}
              <div>
                <Label htmlFor="tenant_id">Оршин суугч</Label>
                <select
                  id="tenant_id"
                  {...register("tenant_id")}
                  className="mt-1 w-full rounded-md border p-2"
                >
                  <option value="">Оршин суугч сонгох</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.phone})
                    </option>
                  ))}
                </select>
                {errors.tenant_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.tenant_id.message}
                  </p>
                )}
              </div>

              {/* Property Filter */}
              <div>
                <Label>Барилгаар шүүх</Label>
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    setValue("unit_id", "");
                  }}
                >
                  <option value="">Бүх барилга</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Selection */}
              <div>
                <Label htmlFor="unit_id">Өрөө (зөвхөн сул өрөө)</Label>
                <select
                  id="unit_id"
                  {...register("unit_id")}
                  className="mt-1 w-full rounded-md border p-2"
                >
                  <option value="">Өрөө сонгох</option>
                  {filteredUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.property.name} - {unit.unit_number}
                      {unit.area_sqm ? ` (${unit.area_sqm}m²)` : ""}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.unit_id.message}
                  </p>
                )}
              </div>

              {/* Contract Period */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="start_date">Эхлэх огноо</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register("start_date")}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.start_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date">Дуусах огноо (заавал биш)</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="monthly_rent">Сарын түрээс (өрөөнөөс)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    {...register("monthly_rent", { valueAsNumber: true })}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Өрөөний талбай × m² үнэ
                  </p>
                  {errors.monthly_rent && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.monthly_rent.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="deposit">Барьцаа</Label>
                  <Input
                    id="deposit"
                    type="number"
                    {...register("deposit", { valueAsNumber: true })}
                  />
                  {errors.deposit && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.deposit.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="payment_due_day">Төлөх өдөр (сар бүр)</Label>
                <select
                  id="payment_due_day"
                  {...register("payment_due_day", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-md border p-2"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}-ны өдөр
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Тэмдэглэл</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  className="mt-1 min-h-[100px] w-full rounded-md border p-2"
                  placeholder="Гэрээний талаар тэмдэглэл..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Үүсгэж байна..." : "Гэрээ үүсгэх"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
