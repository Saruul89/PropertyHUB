"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Unit, Property, Tenant } from "@/types";
import { useFeature } from "@/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MAINTENANCE_CATEGORIES } from "@/lib/constants/maintenance";

const maintenanceSchema = z.object({
  unit_id: z.string().min(1, "Өрөө сонгоно уу"),
  tenant_id: z.string().optional(),
  title: z.string().min(1, "Гарчиг оруулна уу"),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  category: z.string().optional(),
  vendor_name: z.string().optional(),
  vendor_phone: z.string().optional(),
  estimated_cost: z.number().optional(),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface UnitWithProperty extends Unit {
  property: Property;
}

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get("unit_id");
  const hasMaintenanceVendor = useFeature("maintenance_vendor");

  const [units, setUnits] = useState<UnitWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
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
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      unit_id: preselectedUnitId || "",
      priority: "normal",
    },
  });

  const selectedUnitId = watch("unit_id");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Fetch tenant for selected unit
    const fetchTenant = async () => {
      if (!selectedUnitId) return;

      const supabase = createClient();
      const { data: lease } = await supabase
        .from("leases")
        .select("tenant_id")
        .eq("unit_id", selectedUnitId)
        .eq("status", "active")
        .single();

      if (lease) {
        setValue("tenant_id", lease.tenant_id);
      }
    };

    fetchTenant();
  }, [selectedUnitId, setValue]);

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

    // Fetch properties
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("name");

    // Fetch units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*, property:properties(*)")
      .in(
        "property_id",
        (propertiesData || []).map((p: Property) => p.id)
      );

    // Fetch tenants
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("name");

    setProperties(propertiesData || []);
    setUnits((unitsData as UnitWithProperty[]) || []);
    setTenants(tenantsData || []);
    setFetching(false);
  };

  const filteredUnits = selectedProperty
    ? units.filter((u) => u.property_id === selectedProperty)
    : units;

  const onSubmit = async (data: MaintenanceFormData) => {
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

    const unit = units.find((u) => u.id === data.unit_id);
    if (!unit) return;

    const { error: createError } = await supabase
      .from("maintenance_requests")
      .insert({
        unit_id: data.unit_id,
        property_id: unit.property_id,
        company_id: companyUser.company_id,
        requested_by: user.user.id,
        tenant_id: data.tenant_id || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category || null,
        vendor_name: data.vendor_name || null,
        vendor_phone: data.vendor_phone || null,
        estimated_cost: data.estimated_cost || null,
        scheduled_date: data.scheduled_date || null,
        notes: data.notes || null,
        status: "pending",
      });

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/maintenance");
  };

  if (fetching) {
    return (
      <>
        <Header title="Шинэ засварын хүсэлт" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Шинэ засварын хүсэлт" showBack />
      <div className="p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Засварын хүсэлт үүсгэх</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Label htmlFor="unit_id">Өрөө</Label>
                <select
                  id="unit_id"
                  {...register("unit_id")}
                  className="mt-1 w-full rounded-md border p-2"
                >
                  <option value="">Өрөө сонгох</option>
                  {filteredUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.property.name} - {unit.unit_number}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.unit_id.message}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Гарчиг</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Жишээ: Агааржуулалт эвдэрсэн"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Category & Priority */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">Ангилал</Label>
                  <select
                    id="category"
                    {...register("category")}
                    className="mt-1 w-full rounded-md border p-2"
                  >
                    <option value="">Ангилал сонгох</option>
                    {MAINTENANCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Яаралтай эсэх</Label>
                  <select
                    id="priority"
                    {...register("priority")}
                    className="mt-1 w-full rounded-md border p-2"
                  >
                    <option value="low">Бага</option>
                    <option value="normal">Дунд</option>
                    <option value="high">Өндөр</option>
                    <option value="urgent">Яаралтай</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Дэлгэрэнгүй тайлбар</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  className="mt-1 min-h-[100px] w-full rounded-md border p-2"
                  placeholder="Асуудлын дэлгэрэнгүйг бичнэ үү..."
                />
              </div>

              {/* Vendor Info (if feature enabled) */}
              {hasMaintenanceVendor && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="mb-4 font-medium">Гүйцэтгэгчийн мэдээлэл</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="vendor_name">Гүйцэтгэгчийн нэр</Label>
                        <Input
                          id="vendor_name"
                          {...register("vendor_name")}
                          placeholder="Жишээ: АВС ББСБ"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_phone">Гүйцэтгэгчийн утас</Label>
                        <Input
                          id="vendor_phone"
                          {...register("vendor_phone")}
                          placeholder="Жишээ: 99112233"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="estimated_cost">Төсөвт өртөг</Label>
                      <Input
                        id="estimated_cost"
                        type="number"
                        {...register("estimated_cost", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled_date">Товлосон огноо</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        {...register("scheduled_date")}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Тэмдэглэл</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  className="mt-1 min-h-[80px] w-full rounded-md border p-2"
                  placeholder="Бусад тэмдэглэл..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Үүсгэж байна..." : "Хүсэлт үүсгэх"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
