"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bulkUnitSchema, type BulkUnitFormData } from "@/lib/validations";

interface UnitBulkFormProps {
  totalFloors: number;
  onSubmit: (data: BulkUnitFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UnitBulkForm({
  totalFloors,
  onSubmit,
  onCancel,
  isLoading,
}: UnitBulkFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BulkUnitFormData>({
    resolver: zodResolver(bulkUnitSchema),
    defaultValues: {
      startFloor: 1,
      endFloor: totalFloors,
      unitsPerFloor: 4,
      prefix: "",
    },
  });

  const watchedValues = watch();

  // プレビュー生成
  const preview = useMemo(() => {
    const { startFloor, endFloor, unitsPerFloor, prefix } = watchedValues;

    if (!startFloor || !endFloor || !unitsPerFloor) return [];
    if (endFloor < startFloor) return [];

    const units: string[] = [];
    for (let floor = startFloor; floor <= endFloor; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        const unitNumber = `${prefix || ""}${floor}${String(unit).padStart(
          2,
          "0"
        )}`;
        units.push(unitNumber);
      }
    }
    return units;
  }, [watchedValues]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startFloor">Эхлэх давхар</Label>
            <Input
              id="startFloor"
              type="number"
              min={1}
              {...register("startFloor", { valueAsNumber: true })}
            />
            {errors.startFloor && (
              <p className="mt-1 text-sm text-red-500">
                {errors.startFloor.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="endFloor">Сүүлийн давхар</Label>
            <Input
              id="endFloor"
              type="number"
              min={1}
              max={totalFloors}
              {...register("endFloor", { valueAsNumber: true })}
            />
            {errors.endFloor && (
              <p className="mt-1 text-sm text-red-500">
                {errors.endFloor.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unitsPerFloor">Давхар бүрийн өрөөний тоо</Label>
            <Input
              id="unitsPerFloor"
              type="number"
              min={1}
              {...register("unitsPerFloor", { valueAsNumber: true })}
            />
            {errors.unitsPerFloor && (
              <p className="mt-1 text-sm text-red-500">
                {errors.unitsPerFloor.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="prefix">Угтвар (заавал биш)</Label>
            <Input
              id="prefix"
              {...register("prefix")}
              placeholder="Жишээ: A-"
            />
          </div>
        </div>

        {/* プレビュー */}
        {preview.length > 0 && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Урьдчилсан харагдац</span>
              <span className="text-sm text-gray-500">
                {preview.length} өрөөг үүсгэх
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {preview.slice(0, 20).map((unitNumber) => (
                <span
                  key={unitNumber}
                  className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
                >
                  {unitNumber}
                </span>
              ))}
              {preview.length > 20 && (
                <span className="px-2 py-1 text-sm text-gray-500">
                  ...бусад {preview.length - 20} өрөө
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            цуцлах
          </Button>
          <Button type="submit" disabled={isLoading || preview.length === 0}>
            {isLoading ? "Хийгдэж байна..." : `${preview.length} өрөөг бүтээх`}
          </Button>
        </div>
      </form>
    </div>
  );
}
