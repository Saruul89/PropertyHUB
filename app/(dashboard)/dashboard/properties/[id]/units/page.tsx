"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Property, Unit, UnitStatus } from "@/types";
import { Plus, Home, X, Pencil, Trash2, Users, Receipt } from "lucide-react";
import Link from "next/link";
import { useFeature } from "@/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const unitSchema = z.object({
  unit_number: z.string().min(1, "өрөөний дугаар шаардлагатай"),
  floor: z.number().optional(),
  area_sqm: z.number().optional(),
  rooms: z.number().optional(),
  price_per_sqm: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

const statusLabels: Record<UnitStatus, string> = {
  vacant: "Сул өрөө",
  occupied: "Эзэмшигчтэй",
  maintenance: "Засвартай中",
  reserved: "Захиалсан",
};

const statusColors: Record<UnitStatus, string> = {
  vacant: "bg-green-100 text-green-800",
  occupied: "bg-blue-100 text-blue-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  reserved: "bg-purple-100 text-purple-800",
};

export default function UnitsPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const hasVariableFees = useFeature("variable_fees");
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      price_per_sqm: 0,
    },
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyData) {
      setProperty(propertyData);
    }

    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("unit_number");

    if (unitsData) {
      setUnits(unitsData);
    }

    setLoading(false);
  };

  const openNewForm = () => {
    setEditingUnit(null);
    reset({
      unit_number: "",
      floor: undefined,
      area_sqm: undefined,
      rooms: undefined,
      price_per_sqm: 0,
      notes: "",
    });
    setShowForm(true);
  };

  const openEditForm = (unit: Unit) => {
    setEditingUnit(unit);
    reset({
      unit_number: unit.unit_number,
      floor: unit.floor ?? undefined,
      area_sqm: unit.area_sqm ?? undefined,
      rooms: unit.rooms ?? undefined,
      price_per_sqm: unit.price_per_sqm ?? 0,
      notes: unit.notes || "",
    });
    setShowForm(true);
  };

  // フロア番号からfloor_idを取得または作成する
  const getOrCreateFloorId = async (
    supabase: ReturnType<typeof createClient>,
    floorNumber: number
  ): Promise<string | null> => {
    // 既存のフロアを検索
    const { data: existingFloor } = await supabase
      .from("floors")
      .select("id")
      .eq("property_id", propertyId)
      .eq("floor_number", floorNumber)
      .single();

    if (existingFloor) {
      return existingFloor.id;
    }

    // フロアが存在しない場合は作成
    const { data: newFloor } = await supabase
      .from("floors")
      .insert({
        property_id: propertyId,
        floor_number: floorNumber,
        name: `${floorNumber}F`,
      })
      .select("id")
      .single();

    return newFloor?.id || null;
  };

  const onSubmit = async (data: UnitFormData) => {
    setSubmitting(true);
    const supabase = createClient();

    // フロア番号が入力されている場合、floor_idを取得または作成
    let floorId: string | null = null;
    if (data.floor) {
      floorId = await getOrCreateFloorId(supabase, data.floor);
    }

    if (editingUnit) {
      const { error } = await supabase
        .from("units")
        .update({
          unit_number: data.unit_number,
          floor: data.floor || null,
          floor_id: floorId,
          area_sqm: data.area_sqm || null,
          rooms: data.rooms || null,
          price_per_sqm: data.price_per_sqm || null,
          monthly_rent: (data.area_sqm || 0) * (data.price_per_sqm || 0),
          notes: data.notes || null,
        })
        .eq("id", editingUnit.id);

      if (!error) {
        setUnits(
          units.map((u) =>
            u.id === editingUnit.id
              ? { ...u, ...data, floor_id: floorId ?? undefined }
              : u
          )
        );
      }
    } else {
      const { data: newUnit, error } = await supabase
        .from("units")
        .insert({
          property_id: propertyId,
          company_id: property?.company_id,
          unit_number: data.unit_number,
          floor: data.floor || null,
          floor_id: floorId,
          area_sqm: data.area_sqm || null,
          rooms: data.rooms || null,
          price_per_sqm: data.price_per_sqm || null,
          monthly_rent: (data.area_sqm || 0) * (data.price_per_sqm || 0),
          notes: data.notes || null,
          status: "vacant",
        })
        .select()
        .single();

      if (!error && newUnit) {
        setUnits([...units, newUnit]);
      }
    }

    setSubmitting(false);
    setShowForm(false);
    setEditingUnit(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ өрөөг устгах уу?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", id);

    if (!error) {
      setUnits(units.filter((u) => u.id !== id));
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Өрөөг удирдах" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`${property?.name || ""} - Өрөөг удирдах`} showBack />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Бүгд {units.length} өрөө / Сул өрөө{" "}
              {units.filter((u) => u.status === "vacant").length}
            </p>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            Өрөө нэмэх
          </Button>
        </div>

        {/* Unit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingUnit ? "Өрөөг засах" : "Өрөө нэмэх"}
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
                    <Label htmlFor="unit_number">өрөөний дугаар</Label>
                    <Input
                      id="unit_number"
                      {...register("unit_number")}
                      placeholder="Жишээ: 101"
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
                      <Label htmlFor="price_per_sqm">m² үнэ (₮)</Label>
                      <Input
                        id="price_per_sqm"
                        type="number"
                        {...register("price_per_sqm", { valueAsNumber: true })}
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
                        : editingUnit
                        ? "Шинэчлэх"
                        : "Нэмэх"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Units List */}
        {units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">Өрөө бүртгэгдээгүй байна</p>
              <Button onClick={openNewForm}>Хамгийн эхний өрөөг бүртгэх</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {unit.unit_number}
                      </h3>
                      {unit.floor && (
                        <p className="text-sm text-gray-500">
                          {unit.floor}Давхар
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        statusColors[unit.status]
                      }`}
                    >
                      {statusLabels[unit.status]}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {unit.area_sqm && <p>Талбай: {unit.area_sqm}m²</p>}
                    {unit.rooms && <p>Өрөөний тоо: {unit.rooms}</p>}
                    <p className="font-medium text-gray-900">
                      ₮{unit.monthly_rent.toLocaleString()}/сар
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditForm(unit)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      засах
                    </Button>
                    {hasVariableFees && (
                      <Link
                        href={`/dashboard/properties/${propertyId}/units/${unit.id}/fees`}
                      >
                        <Button variant="outline" size="sm">
                          <Receipt className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(unit.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
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
