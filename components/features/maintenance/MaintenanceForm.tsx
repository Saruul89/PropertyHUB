"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Unit, Property, MaintenanceRequest } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface UnitWithProperty extends Unit {
  property: Property;
}

export interface MaintenanceFormProps {
  initialData?: Partial<MaintenanceFormData>;
  units: UnitWithProperty[];
  properties: Property[];
  showVendorSection?: boolean;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const CATEGORIES = [
  "Ус алдах",
  "Цахилгааны асуудал",
  "Агааржуулалт",
  "Хаалга, цонх",
  "Шал, хана, тааз",
  "Бохирын шугам",
  "Хамгаалалт",
  "Бусад",
];

export function MaintenanceForm({
  initialData,
  units,
  properties,
  showVendorSection = false,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Хүсэлт үүсгэх",
}: MaintenanceFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
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
      unit_id: initialData?.unit_id || "",
      tenant_id: initialData?.tenant_id || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      priority: initialData?.priority || "normal",
      category: initialData?.category || "",
      vendor_name: initialData?.vendor_name || "",
      vendor_phone: initialData?.vendor_phone || "",
      estimated_cost: initialData?.estimated_cost,
      scheduled_date: initialData?.scheduled_date || "",
      notes: initialData?.notes || "",
    },
  });

  const selectedUnitId = watch("unit_id");

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

  const filteredUnits = selectedProperty
    ? units.filter((u) => u.property_id === selectedProperty)
    : units;

  const handleFormSubmit = async (data: MaintenanceFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Засварын хүсэлт</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
              placeholder="Жишээ: Ус алдах"
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
              <Label htmlFor="category">Категори</Label>
              <select
                id="category"
                {...register("category")}
                className="mt-1 w-full rounded-md border p-2"
              >
                <option value="">Категори сонгох</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="mt-1 w-full rounded-md border p-2"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Дэлгэрэнгүй мэдээлэл</Label>
            <textarea
              id="description"
              {...register("description")}
              className="mt-1 min-h-[100px] w-full rounded-md border p-2"
              placeholder="Проблемын тодорхойлолтыг бичих"
            />
          </div>

          {/* Vendor Info (if feature enabled) */}
          {showVendorSection && (
            <>
              <div className="border-t pt-4">
                <h3 className="mb-4 font-medium">Засварын ажилтаны мэдээлэл</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="vendor_name">Ажилтаны нэр</Label>
                    <Input
                      id="vendor_name"
                      {...register("vendor_name")}
                      placeholder="Жишээ: Баторших компани"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor_phone">Ажилтаны утас</Label>
                    <Input
                      id="vendor_phone"
                      {...register("vendor_phone")}
                      placeholder="Жишээ: 1234-5678"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="estimated_cost">Төлөвлөж буй үнэ</Label>
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
                  <Label htmlFor="scheduled_date">Засварын хугацаа</Label>
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
              placeholder="Бусад мэдээллийг бичих"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Цуцлах
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Үүсгэж байна..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
