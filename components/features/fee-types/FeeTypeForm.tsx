"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeType, FeeCalculationType } from "@/types";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const feeTypeSchema = z.object({
  name: z.string().min(1, "Төлбөрийн нэр заавал бөглөх ёстой"),
  calculation_type: z.enum(["fixed", "per_sqm", "metered", "custom"]),
  unit_label: z.string().optional(),
  default_amount: z.number().min(0),
  default_unit_price: z.number().optional(),
});

type FeeTypeFormData = z.infer<typeof feeTypeSchema>;

const calculationTypeLabels: Record<FeeCalculationType, string> = {
  fixed: "Тогтмол",
  per_sqm: "Талбайгаар (м²)",
  metered: "Тоолуураар",
  custom: "Тусгай",
};

const calculationTypeDescriptions: Record<FeeCalculationType, string> = {
  fixed: "Сар бүр ижил дүн",
  per_sqm: "Талбай × нэгж үнэ",
  metered: "Хэрэглээ × нэгж үнэ",
  custom: "Гараар дүн оруулна",
};

interface FeeTypeFormProps {
  feeType?: FeeType | null;
  onSubmit: (data: FeeTypeFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function FeeTypeForm({
  feeType,
  onSubmit,
  onCancel,
  submitting = false,
}: FeeTypeFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeeTypeFormData>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: {
      calculation_type: "fixed",
      default_amount: 0,
    },
  });

  const calculationType = watch("calculation_type");

  useEffect(() => {
    if (feeType) {
      reset({
        name: feeType.name,
        calculation_type: feeType.calculation_type,
        unit_label: feeType.unit_label || "₮",
        default_amount: feeType.default_amount,
        default_unit_price: feeType.default_unit_price ?? undefined,
      });
    } else {
      reset({
        name: "",
        calculation_type: "fixed",
        unit_label: "₮",
        default_amount: 0,
        default_unit_price: undefined,
      });
    }
  }, [feeType, reset]);

  const getUnitLabel = (type: FeeCalculationType) => {
    switch (type) {
      case "per_sqm":
        return "₮/м²";
      case "metered":
        return "₮/нэгж";
      default:
        return "₮";
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {feeType ? "Төлбөрийн төрөл засах" : "Төлбөрийн төрөл нэмэх"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Төлбөрийн нэр</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Жишээ: Үйлчилгээний хураамж, Усны төлбөр"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>Тооцоолох арга</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(calculationTypeLabels) as FeeCalculationType[]).map(
                (type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                      calculationType === type
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register("calculation_type")}
                      className="sr-only"
                    />
                    <span className="font-medium">
                      {calculationTypeLabels[type]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {calculationTypeDescriptions[type]}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {calculationType === "fixed" && (
            <div>
              <Label htmlFor="default_amount">Үндсэн дүн</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="default_amount"
                  type="number"
                  {...register("default_amount", { valueAsNumber: true })}
                />
                <span className="text-gray-500">₮</span>
              </div>
            </div>
          )}

          {(calculationType === "per_sqm" || calculationType === "metered") && (
            <div>
              <Label htmlFor="default_unit_price">Үндсэн нэгж үнэ</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="default_unit_price"
                  type="number"
                  {...register("default_unit_price", { valueAsNumber: true })}
                />
                <span className="text-gray-500">
                  {getUnitLabel(calculationType)}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="unit_label">Нэгжийн шошго (заавал биш)</Label>
            <Input
              id="unit_label"
              {...register("unit_label")}
              placeholder="Жишээ: ₮/сар, ₮/м³"
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
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : feeType ? "Шинэчлэх" : "Нэмэх"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
