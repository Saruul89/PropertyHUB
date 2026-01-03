"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeeType, FeeCalculationType } from "@/types";
import { Pencil, Trash2, GripVertical, Receipt } from "lucide-react";

const calculationTypeLabels: Record<FeeCalculationType, string> = {
  fixed: "Тогтмол",
  per_sqm: "Талбайгаар (м²)",
  metered: "Тоолуураар",
  custom: "Тусгай",
};

interface FeeTypeListProps {
  feeTypes: FeeType[];
  loading: boolean;
  onEdit: (feeType: FeeType) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function FeeTypeList({
  feeTypes,
  loading,
  onEdit,
  onDelete,
  onAdd,
}: FeeTypeListProps) {
  if (loading) {
    return <div className="text-center text-gray-500">Ачааллаж байна...</div>;
  }

  if (feeTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-600">Төлбөрийн төрөл тохируулаагүй байна</p>
          <Button onClick={onAdd}>Эхний төлбөрийн төрөл нэмэх</Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
                      Үндсэн дүн: ₮{feeType.default_amount.toLocaleString()}
                    </span>
                  )}
                  {(feeType.calculation_type === "per_sqm" ||
                    feeType.calculation_type === "metered") &&
                    feeType.default_unit_price && (
                      <span>
                        Нэгж үнэ: ₮{feeType.default_unit_price.toLocaleString()}
                      </span>
                    )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(feeType)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(feeType.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
