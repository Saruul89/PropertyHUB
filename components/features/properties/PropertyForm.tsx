"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { propertySchema, type PropertyFormData } from "@/lib/validations";
import type { Property } from "@/types";

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type: "apartment",
      total_floors: 1,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Барилгын төрөл</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="apartment"
              {...register("property_type")}
            />
            Apart
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="office" {...register("property_type")} />
            Оффис
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Барилгын нэр</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Жишээ: Twin, 52-a байр"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Хаяг</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="Жишээ: СБД 7р хороо..."
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="total_floors">Нийт давхарын тоо</Label>
        <Input
          id="total_floors"
          type="number"
          min={1}
          {...register("total_floors", { valueAsNumber: true })}
        />
        {errors.total_floors && (
          <p className="mt-1 text-sm text-red-500">
            {errors.total_floors.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Тайлбар（заавал биш）</Label>
        <textarea
          id="description"
          {...register("description")}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Барилгын тайлбар..."
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Хадгалаж байна..." : "Хадгалах"}
        </Button>
      </div>
    </form>
  );
}
