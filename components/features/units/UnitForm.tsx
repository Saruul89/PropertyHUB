"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unitSchema, type UnitFormData } from "@/lib/validations";
import { UnitStatusSelect } from "./UnitStatusSelect";
import type { Unit, UnitStatus } from "@/types";

interface UnitFormProps {
  defaultValues?: Partial<Unit>;
  onSubmit: (data: UnitFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function UnitForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  isEditing,
}: UnitFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unit_number: defaultValues?.unit_number || "",
      floor: defaultValues?.floor ?? undefined,
      area_sqm: defaultValues?.area_sqm ?? undefined,
      rooms: defaultValues?.rooms ?? undefined,
      monthly_rent: defaultValues?.monthly_rent ?? 0,
      status: defaultValues?.status || "vacant",
      notes: defaultValues?.notes || "",
    },
  });

  const currentStatus = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="unit_number">өрөөний дугаар</Label>
        <Input
          id="unit_number"
          {...register("unit_number")}
          placeholder="例: 101"
        />
        {errors.unit_number && (
          <p className="mt-1 text-sm text-red-500">
            {errors.unit_number.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="floor">Давхар</Label>
          <Input
            id="floor"
            type="number"
            {...register("floor", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="rooms">Өрөөний тоо</Label>
          <Input
            id="rooms"
            type="number"
            {...register("rooms", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="area_sqm">Талбай (m²)</Label>
          <Input
            id="area_sqm"
            type="number"
            step="0.01"
            {...register("area_sqm", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="monthly_rent">Сарын түрээс</Label>
          <Input
            id="monthly_rent"
            type="number"
            {...register("monthly_rent", { valueAsNumber: true })}
          />
        </div>
      </div>

      {isEditing && (
        <div>
          <Label>Статус</Label>
          <UnitStatusSelect
            value={currentStatus as UnitStatus}
            onChange={(status) => setValue("status", status)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes">Тэмдэглэл</Label>
        <textarea
          id="notes"
          {...register("notes")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Цуцлах
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Хадгалаж байна..." : isEditing ? "Шинэчлэх" : "Нэмэх"}
        </Button>
      </div>
    </form>
  );
}
