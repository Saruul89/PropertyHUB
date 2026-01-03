"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { FeeType, FeeCalculationType } from "@/types";
import { Plus, X, Pencil, Trash2, GripVertical, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const feeTypeSchema = z.object({
  name: z.string().min(1, "Төлбөрийн нэр заавал"),
  calculation_type: z.enum(["fixed", "per_sqm", "metered", "custom"]),
  unit_label: z.string().optional(),
  default_amount: z.number().min(0),
  default_unit_price: z.number().optional(),
});

type FeeTypeFormData = z.infer<typeof feeTypeSchema>;

const calculationTypeLabels: Record<FeeCalculationType, string> = {
  fixed: "Тогтмол төлбөр",
  per_sqm: "Талбайн нэгж үнэ",
  metered: "Тоолуур",
  custom: "Өөрчлөн тохируулах",
};

const calculationTypeDescriptions: Record<FeeCalculationType, string> = {
  fixed: "Сар бүр ижил дүн",
  per_sqm: "Талбай×нэгж үнэ-ээр тооцоолно",
  metered: "Хэрэглээ×нэгж үнэ-ээр тооцоолно",
  custom: "Дүнг гараар оруулна",
};

export default function FeeTypesPage() {
  const { companyId } = useAuth();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (companyId) {
      fetchFeeTypes();
    }
  }, [companyId]);

  const fetchFeeTypes = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fee_types")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("display_order");

    if (!error && data) {
      setFeeTypes(data);
    }
    setLoading(false);
  };

  const openNewForm = () => {
    setEditingFeeType(null);
    reset({
      name: "",
      calculation_type: "fixed",
      unit_label: "₮",
      default_amount: 0,
      default_unit_price: undefined,
    });
    setShowForm(true);
  };

  const openEditForm = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    reset({
      name: feeType.name,
      calculation_type: feeType.calculation_type,
      unit_label: feeType.unit_label || "₮",
      default_amount: feeType.default_amount,
      default_unit_price: feeType.default_unit_price ?? undefined,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: FeeTypeFormData) => {
    setSubmitting(true);
    const supabase = createClient();

    if (editingFeeType) {
      const { error } = await supabase
        .from("fee_types")
        .update({
          name: data.name,
          calculation_type: data.calculation_type,
          unit_label: data.unit_label,
          default_amount: data.default_amount,
          default_unit_price: data.default_unit_price || null,
        })
        .eq("id", editingFeeType.id);

      if (!error) {
        setFeeTypes(
          feeTypes.map((f) =>
            f.id === editingFeeType.id
              ? {
                  ...f,
                  ...data,
                  default_unit_price: data.default_unit_price ?? undefined,
                }
              : f
          )
        );
      }
    } else {
      const maxOrder = feeTypes.reduce(
        (max, f) => Math.max(max, f.display_order),
        0
      );
      const { data: newFeeType, error } = await supabase
        .from("fee_types")
        .insert({
          company_id: companyId,
          name: data.name,
          calculation_type: data.calculation_type,
          unit_label: data.unit_label,
          default_amount: data.default_amount,
          default_unit_price: data.default_unit_price || null,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (!error && newFeeType) {
        setFeeTypes([...feeTypes, newFeeType]);
      }
    }

    setSubmitting(false);
    setShowForm(false);
    setEditingFeeType(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ төлбөрийн төрлийг устгах уу?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("fee_types")
      .update({ is_active: false })
      .eq("id", id);

    if (!error) {
      setFeeTypes(feeTypes.filter((f) => f.id !== id));
    }
  };

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
    <>
      <Header title="Төлбөрийн төрлийн тохиргоо" showBack />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">Нэхэмжлэлд багтах төлбөрийн төрлүүдийг тохируулна</p>
          <Button onClick={openNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            Төлбөрийн төрөл нэмэх
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingFeeType
                    ? "Төлбөрийн хэлбэр засах"
                    : "Төлбөрийн хэлбэр нэмэх"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                >
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
                      <p className="mt-1 text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Тооцоолох арга</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(
                        Object.keys(
                          calculationTypeLabels
                        ) as FeeCalculationType[]
                      ).map((type) => (
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
                      ))}
                    </div>
                  </div>

                  {calculationType === "fixed" && (
                    <div>
                      <Label htmlFor="default_amount">Үндсэн дүн</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="default_amount"
                          type="number"
                          {...register("default_amount", {
                            valueAsNumber: true,
                          })}
                        />
                        <span className="text-gray-500">₮</span>
                      </div>
                    </div>
                  )}

                  {(calculationType === "per_sqm" ||
                    calculationType === "metered") && (
                    <div>
                      <Label htmlFor="default_unit_price">Үндсэн нэгж үнэ</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="default_unit_price"
                          type="number"
                          {...register("default_unit_price", {
                            valueAsNumber: true,
                          })}
                        />
                        <span className="text-gray-500">
                          {getUnitLabel(calculationType)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="unit_label">Нэгжийн тэмдэглэгээ (заавал биш)</Label>
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
                      onClick={() => setShowForm(false)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Хадгалаж байна..."
                        : editingFeeType
                        ? "Шинэчлэх"
                        : "Нэмэх"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fee Types List */}
        {loading ? (
          <div className="text-center text-gray-500">Ачааллаж байна...</div>
        ) : feeTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">
                Төлбөрийн төрөл тохируулагдаагүй байна
              </p>
              <Button onClick={openNewForm}>Эхний төлбөрийн төрөл нэмэх</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {feeTypes.map((feeType) => (
              <Card key={feeType.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 cursor-grab text-gray-400" />
                    <div>
                      <h3 className="font-medium">{feeType.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="rounded bg-gray-100 px-2 py-0.5">
                          {calculationTypeLabels[feeType.calculation_type]}
                        </span>
                        {feeType.calculation_type === "fixed" && (
                          <span>
                            Үндсэн: ₮
                            {feeType.default_amount.toLocaleString()}
                          </span>
                        )}
                        {(feeType.calculation_type === "per_sqm" ||
                          feeType.calculation_type === "metered") &&
                          feeType.default_unit_price && (
                            <span>
                              Нэгж үнэ: ₮
                              {feeType.default_unit_price.toLocaleString()}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(feeType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(feeType.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
