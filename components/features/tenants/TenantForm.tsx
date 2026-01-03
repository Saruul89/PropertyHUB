"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantSchema, type TenantFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import type { Property, Unit, Tenant } from "@/types";

interface TenantFormProps {
  companyId: string;
  defaultValues?: Partial<Tenant>;
  onSubmit: (data: TenantFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function TenantForm({
  companyId,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  isEditing,
}: TenantFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      tenant_type: defaultValues?.tenant_type || "individual",
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      company_name: defaultValues?.company_name || "",
      email: defaultValues?.email || "",
      emergency_contact_name: defaultValues?.emergency_contact_name || "",
      emergency_contact_phone: defaultValues?.emergency_contact_phone || "",
      notes: defaultValues?.notes || "",
    },
  });

  const tenantType = watch("tenant_type");

  useEffect(() => {
    if (companyId && !isEditing) {
      fetchProperties();
    }
  }, [companyId, isEditing]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnits(selectedPropertyId);
    } else {
      setUnits([]);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (data) {
      setProperties(data);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .eq("status", "vacant")
      .order("unit_number");

    if (data) {
      setUnits(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>入居者タイプ</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="individual"
              {...register("tenant_type")}
            />
            個人
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="company" {...register("tenant_type")} />
            法人
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="name">
          {tenantType === "company" ? "担当者名" : "名前"}
        </Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {tenantType === "company" && (
        <div>
          <Label htmlFor="company_name">会社名</Label>
          <Input id="company_name" {...register("company_name")} />
        </div>
      )}

      <div>
        <Label htmlFor="phone">
          電話番号{!isEditing && "（ログインIDとして使用）"}
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="99001234"
          disabled={isEditing}
          className={isEditing ? "bg-gray-50" : ""}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">メールアドレス（任意）</Label>
        <Input id="email" type="email" {...register("email")} />
      </div>

      {!isEditing && (
        <div className="border-t pt-4">
          <Label>部屋を割り当て（任意）</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">物件を選択</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("unit_id")}
                disabled={!selectedPropertyId}
              >
                <option value="">部屋を選択</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedPropertyId && units.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">Сул өрөөがありません</p>
          )}
        </div>
      )}

      <div className="border-t pt-4">
        <Label>緊急連絡先（任意）</Label>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <Input
            placeholder="連絡先名"
            {...register("emergency_contact_name")}
          />
          <Input
            placeholder="電話番号"
            {...register("emergency_contact_phone")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Тэмдэглэл</Label>
        <textarea
          id="notes"
          {...register("notes")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Хадгалах中..."
            : isEditing
            ? "Хадгалахする"
            : "登録する"}
        </Button>
      </div>
    </form>
  );
}
