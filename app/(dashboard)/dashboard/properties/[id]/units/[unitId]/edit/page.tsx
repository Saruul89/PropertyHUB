"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitForm } from "@/components/features/units";
import { createClient } from "@/lib/supabase/client";
import type { Unit, Property } from "@/types";
import type { UnitFormData } from "@/lib/validations";

interface UnitWithProperty extends Unit {
  properties?: Property;
}

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const unitId = params.unitId as string;
  const [unit, setUnit] = useState<UnitWithProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  const fetchUnit = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("units")
      .select("*, properties(*)")
      .eq("id", unitId)
      .single();

    if (error || !data) {
      router.push(`/dashboard/properties/${propertyId}`);
      return;
    }

    setUnit(data);
    setLoading(false);
  };

  const handleSubmit = async (data: UnitFormData) => {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("units")
      .update({
        unit_number: data.unit_number,
        floor: data.floor || null,
        area_sqm: data.area_sqm || null,
        rooms: data.rooms || null,
        price_per_sqm: data.price_per_sqm || null,
        monthly_rent: (data.area_sqm || 0) * (data.price_per_sqm || 0),
        notes: data.notes || null,
      })
      .eq("id", unitId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/dashboard/properties/${propertyId}/units/${unitId}`);
  };

  if (loading || !unit) {
    return (
      <>
        <Header title="Өрөөг засах" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${unit.properties?.name || ""} - ${unit.unit_number} засах`}
        showBack
      />
      <div className="p-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Өрөөний мэдээллийг засах</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}
            <UnitForm
              defaultValues={unit}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              isLoading={saving}
              isEditing
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
