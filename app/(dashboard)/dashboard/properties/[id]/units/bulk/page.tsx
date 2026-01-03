"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitBulkForm } from "@/components/features/units";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/types";
import type { BulkUnitFormData } from "@/lib/validations";

export default function BulkUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error || !data) {
      router.push("/dashboard/properties");
      return;
    }

    setProperty(data);
    setLoading(false);
  };

  const handleSubmit = async (data: BulkUnitFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/properties/${propertyId}/units/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Өрөөнүүдийг үүсгэхэд алдаа гарлаа");
      }

      router.push(`/dashboard/properties/${propertyId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Өрөөнүүдийг үүсгэхэд алдаа гарлаа"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !property) {
    return (
      <>
        <Header title="Өрөөг нэг дор бүртгэх" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`${property.name} - Өрөөг нэг дор бүртгэх`} showBack />
      <div className="p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Өрөөг нэг дор бүртгэх</CardTitle>
            <p className="text-sm text-gray-500">
              Олон өрөөг нэг дор үүсгэх боломжтой。Өрөөний дугаар「угтвар +
              давхарын дугаар + дараалласан тоо」гэх маягаар бүтээгдэнэ
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}
            <UnitBulkForm
              totalFloors={property.total_floors}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              isLoading={submitting}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
