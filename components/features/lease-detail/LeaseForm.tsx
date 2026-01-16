"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseTermsEditor } from "./LeaseTermsEditor";
import { leaseSchema, LeaseFormData } from "@/lib/validations";
import { useFeature } from "@/hooks/use-feature";
import { createClient } from "@/lib/supabase/client";
import { Tenant, Unit, Property, LeaseTerms } from "@/types";
import { Save, X } from "lucide-react";

interface LeaseFormProps {
  defaultValues?: Partial<LeaseFormData>;
  onSubmit: (data: LeaseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  companyId: string;
}

export function LeaseForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
  companyId,
}: LeaseFormProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [terms, setTerms] = useState<LeaseTerms>(defaultValues?.terms || {});

  const hasLeaseManagement = useFeature("lease_management");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      status: "active",
      payment_due_day: 1,
      ...defaultValues,
    },
  });

  const watchUnitId = watch("unit_id");

  useEffect(() => {
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnits(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    const [tenantsRes, propertiesRes] = await Promise.all([
      supabase
        .from("tenants")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("properties")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
    ]);

    setTenants(tenantsRes.data || []);
    setProperties(propertiesRes.data || []);
  };

  const fetchUnits = async (propertyId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("unit_number");

    setUnits(data || []);
  };

  const handleFormSubmit = (data: LeaseFormData) => {
    onSubmit({
      ...data,
      terms: hasLeaseManagement ? terms : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Үндсэн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tenant_id">Түрээслэгч *</Label>
            <select
              id="tenant_id"
              className="mt-1 w-full rounded-md border p-2"
              {...register("tenant_id")}
            >
              <option value="">Түрээслэгч сонгох</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.tenant_type === "company"
                    ? tenant.company_name
                    : tenant.name}
                </option>
              ))}
            </select>
            {errors.tenant_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.tenant_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="property">Барилга *</Label>
            <select
              id="property"
              className="mt-1 w-full rounded-md border p-2"
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setValue("unit_id", "");
              }}
            >
              <option value="">Барилга сонгох</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="unit_id">Өрөө *</Label>
            <select
              id="unit_id"
              className="mt-1 w-full rounded-md border p-2"
              {...register("unit_id")}
              disabled={!selectedPropertyId}
            >
              <option value="">Өрөө сонгох</option>
              {units.map((unit) => (
                <option
                  key={unit.id}
                  value={unit.id}
                  disabled={
                    unit.status !== "vacant" &&
                    unit.id !== defaultValues?.unit_id
                  }
                >
                  {unit.unit_number}
                  {unit.status !== "vacant" &&
                  unit.id !== defaultValues?.unit_id
                    ? " (Эзэмшигчтэй)"
                    : ""}
                </option>
              ))}
            </select>
            {errors.unit_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.unit_id.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Гэрээ эхлэх огноо *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="end_date">Гэрээ дуусах огноо</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
              <p className="mt-1 text-xs text-gray-500">
                Хоосон үед хугацаагүй гэрээ
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="monthly_rent">Сарын түрээс *</Label>
              <Input
                id="monthly_rent"
                type="number"
                {...register("monthly_rent", { valueAsNumber: true })}
              />
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
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="payment_due_day">Төлбөрийн хугацаа (өдөр)</Label>
              <select
                id="payment_due_day"
                className="mt-1 w-full rounded-md border p-2"
                {...register("payment_due_day", { valueAsNumber: true })}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Сар бүрийн {day}-нд
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status">Төлөв *</Label>
              <select
                id="status"
                className="mt-1 w-full rounded-md border p-2"
                {...register("status")}
              >
                <option value="pending">Хүлээгдэж буй</option>
                <option value="active">Идэвхтэй</option>
                <option value="expired">Хугацаа дууссан</option>
                <option value="terminated">Дууссан</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Тэмдэглэл</Label>
            <textarea
              id="notes"
              className="mt-1 w-full rounded-md border p-2"
              rows={3}
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {hasLeaseManagement && (
        <LeaseTermsEditor value={terms} onChange={setTerms} />
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Хадгалж байна..." : isEditing ? "Шинэчлэх" : "Бүртгэх"}
        </Button>
      </div>
    </form>
  );
}
