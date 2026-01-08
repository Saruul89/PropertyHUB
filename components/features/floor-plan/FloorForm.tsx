"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Floor, FloorInput } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const floorSchema = z.object({
  floor_number: z.number(),
  name: z.string().optional(),
  plan_width: z.number().min(100).max(2000).optional(),
  plan_height: z.number().min(100).max(2000).optional(),
  plan_image_url: z.string().url().optional().or(z.literal("")),
});

export type FloorFormData = z.infer<typeof floorSchema>;

export interface FloorFormProps {
  floor?: Floor;
  onSubmit: (data: FloorInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FloorForm({
  floor,
  onSubmit,
  onCancel,
  isLoading = false,
}: FloorFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!floor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FloorFormData>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      floor_number: floor?.floor_number ?? 1,
      name: floor?.name || "",
      plan_width: floor?.plan_width || 800,
      plan_height: floor?.plan_height || 600,
      plan_image_url: floor?.plan_image_url || "",
    },
  });

  const handleFormSubmit = async (data: FloorFormData) => {
    setError(null);
    try {
      await onSubmit({
        floor_number: data.floor_number,
        name: data.name || undefined,
        plan_width: data.plan_width || 800,
        plan_height: data.plan_height || 600,
        plan_image_url: data.plan_image_url || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Давхар засах" : "Шинэ давхар нэмэх"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Floor Number */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="floor_number">Давхарын тоо</Label>
              <Input
                id="floor_number"
                type="number"
                {...register("floor_number", { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.floor_number && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.floor_number.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Газар доорх давхрыг сөрөг тоогоор (жишээ: -1)
              </p>
            </div>
            <div>
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Жишээ: 1F, B1, Дээвэр"
              />
              <p className="mt-1 text-xs text-gray-500">
                Хоосон бол давхарын дугаар + F ашиглана
              </p>
            </div>
          </div>

          {/* Plan Dimensions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="plan_width">Зургийн өргөн (px)</Label>
              <Input
                id="plan_width"
                type="number"
                {...register("plan_width", { valueAsNumber: true })}
                placeholder="800"
              />
              {errors.plan_width && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.plan_width.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="plan_height">Зургийн өндөр (px)</Label>
              <Input
                id="plan_height"
                type="number"
                {...register("plan_height", { valueAsNumber: true })}
                placeholder="600"
              />
              {errors.plan_height && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.plan_height.message}
                </p>
              )}
            </div>
          </div>

          {/* Background Image URL */}
          <div>
            <Label htmlFor="plan_image_url">Дэвсгэр зургийн URL (заавал биш)</Label>
            <Input
              id="plan_image_url"
              {...register("plan_image_url")}
              placeholder="https://..."
            />
            {errors.plan_image_url && (
              <p className="mt-1 text-sm text-red-500">
                {errors.plan_image_url.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Давхрын зургийн URL
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Цуцлах
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Хадгалж байна..." : isEditing ? "Шинэчлэх" : "Нэмэх"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
