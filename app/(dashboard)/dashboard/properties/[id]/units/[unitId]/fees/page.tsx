"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useFeature } from "@/hooks";
import { FeeType, Unit, UnitFee, FeeCalculationType } from "@/types";
import { Save, Receipt, Pencil, X, Check } from "lucide-react";

const calculationTypeLabels: Record<FeeCalculationType, string> = {
  fixed: "Тогтмол төлбөр",
  per_sqm: "Талбайн үнэ",
  metered: "Метер",
  custom: "Custom",
};

interface FeeWithUnitFee {
  fee_type: FeeType;
  unit_fee: UnitFee | null;
}

export default function UnitFeesPage() {
  const params = useParams();
  const router = useRouter();
  const { companyId } = useAuth();
  const hasVariableFees = useFeature("variable_fees");

  const propertyId = params.id as string;
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [fees, setFees] = useState<FeeWithUnitFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    custom_amount?: number;
    custom_unit_price?: number;
  }>({});

  useEffect(() => {
    if (companyId && unitId) {
      fetchData();
    }
  }, [companyId, unitId]);

  const fetchData = async () => {
    const supabase = createClient();

    // Get unit info
    const { data: unitData } = await supabase
      .from("units")
      .select("*")
      .eq("id", unitId)
      .single();

    if (unitData) {
      setUnit(unitData);
    }

    // Get fees through API
    const { data: feeTypesData } = await supabase
      .from("fee_types")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("display_order");

    const { data: unitFeesData } = await supabase
      .from("unit_fees")
      .select("*")
      .eq("unit_id", unitId);

    if (feeTypesData) {
      const unitFeeMap = new Map(
        unitFeesData?.map((uf: UnitFee) => [uf.fee_type_id, uf]) ?? []
      );

      const combinedFees: FeeWithUnitFee[] = feeTypesData.map(
        (feeType: FeeType) => ({
          fee_type: feeType,
          unit_fee: unitFeeMap.get(feeType.id) ?? null,
        })
      );

      setFees(combinedFees);
    }

    setLoading(false);
  };

  const handleEdit = (feeTypeId: string, unitFee: UnitFee | null) => {
    setEditingFeeId(feeTypeId);
    setEditValues({
      custom_amount: unitFee?.custom_amount ?? undefined,
      custom_unit_price: unitFee?.custom_unit_price ?? undefined,
    });
  };

  const handleSave = async (feeTypeId: string) => {
    setSaving(true);
    const supabase = createClient();

    const existingUnitFee = fees.find(
      (f) => f.fee_type.id === feeTypeId
    )?.unit_fee;

    if (existingUnitFee) {
      // Update existing
      await supabase
        .from("unit_fees")
        .update({
          custom_amount: editValues.custom_amount || null,
          custom_unit_price: editValues.custom_unit_price || null,
        })
        .eq("id", existingUnitFee.id);
    } else {
      // Insert new
      await supabase.from("unit_fees").insert({
        unit_id: unitId,
        fee_type_id: feeTypeId,
        custom_amount: editValues.custom_amount || null,
        custom_unit_price: editValues.custom_unit_price || null,
      });
    }

    setEditingFeeId(null);
    setEditValues({});
    setSaving(false);
    fetchData();
  };

  const handleCancel = () => {
    setEditingFeeId(null);
    setEditValues({});
  };

  const handleRemoveCustom = async (feeTypeId: string) => {
    if (!confirm("Custom тохируулгыг устгах уу?")) return;

    const supabase = createClient();
    const unitFee = fees.find((f) => f.fee_type.id === feeTypeId)?.unit_fee;

    if (unitFee) {
      await supabase.from("unit_fees").delete().eq("id", unitFee.id);
      fetchData();
    }
  };

  if (!hasVariableFees) {
    return (
      <>
        <Header title="Өрөө тус бүрийн төлбөрийн тохируулга" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Хувьсах төлбөрийн функц боломжгүй байна</p>
              <p className="text-sm text-gray-500">
                Энэ функцийг идэвхжүүлэхийн тулд админтай холбогдоно уу
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="Өрөө тус бүрийн төлбөрийн тохиргоо" showBack />
        <div className="p-6 text-center text-gray-500">Ачааллаж байна...</div>
      </>
    );
  }

  return (
    <>
      <Header title={`${unit?.unit_number} - Төлбөрийн тохиргоо`} showBack />
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Өрөө тус бүрийн төлбөрийн тохиргоо
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Энэ өрөөнд тусгай төлбөр тохируулах боломжтой. Тохируулаагүй бол үндсэн утга ашиглагдана.
            </p>
          </CardContent>
        </Card>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Төлбөрийн төрөл
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Тооцоолох арга
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Үндсэн
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Энэ өрөөний тохиргоо
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fees.map(({ fee_type, unit_fee }) => {
                const isEditing = editingFeeId === fee_type.id;
                const hasCustom =
                  !!unit_fee?.custom_amount || !!unit_fee?.custom_unit_price;

                return (
                  <tr key={fee_type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{fee_type.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {calculationTypeLabels[fee_type.calculation_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fee_type.calculation_type === "fixed" && (
                        <span>₮{fee_type.default_amount.toLocaleString()}</span>
                      )}
                      {(fee_type.calculation_type === "per_sqm" ||
                        fee_type.calculation_type === "metered") && (
                        <span>
                          ₮{fee_type.default_unit_price?.toLocaleString()}/нэгж
                        </span>
                      )}
                      {fee_type.calculation_type === "custom" && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          {fee_type.calculation_type === "fixed" && (
                            <Input
                              type="number"
                              value={editValues.custom_amount ?? ""}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  custom_amount: e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                })
                              }
                              placeholder="Тусгай дүн"
                              className="w-32 text-right"
                            />
                          )}
                          {(fee_type.calculation_type === "per_sqm" ||
                            fee_type.calculation_type === "metered") && (
                            <Input
                              type="number"
                              value={editValues.custom_unit_price ?? ""}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  custom_unit_price: e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                })
                              }
                              placeholder="Тусгай нэгж үнэ"
                              className="w-32 text-right"
                            />
                          )}
                        </div>
                      ) : hasCustom ? (
                        <span className="font-medium text-blue-600">
                          {fee_type.calculation_type === "fixed" &&
                            unit_fee?.custom_amount && (
                              <>₮{unit_fee.custom_amount.toLocaleString()}</>
                            )}
                          {(fee_type.calculation_type === "per_sqm" ||
                            fee_type.calculation_type === "metered") &&
                            unit_fee?.custom_unit_price && (
                              <>
                                ₮{unit_fee.custom_unit_price.toLocaleString()}
                                /нэгж
                              </>
                            )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Болих
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(fee_type.id)}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Хадгалах
                            </Button>
                          </>
                        ) : hasCustom ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(fee_type.id, unit_fee)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCustom(fee_type.id)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fee_type.id, null)}
                          >
                            Тусгай тохиргоо
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
