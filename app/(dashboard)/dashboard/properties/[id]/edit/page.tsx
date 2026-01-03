"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyForm } from "@/components/features/properties";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/types";
import type { PropertyFormData } from "@/lib/validations";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (data: PropertyFormData) => {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        name: data.name,
        property_type: data.property_type,
        address: data.address,
        description: data.description || null,
        total_floors: data.total_floors,
      })
      .eq("id", propertyId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/dashboard/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <>
        <Header title="Барилгыг засах" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Барилгыг засах" showBack />
      <div className="p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Барилгын мэдээллийг засах</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}
            {property && (
              <PropertyForm
                defaultValues={{
                  name: property.name,
                  property_type: property.property_type,
                  address: property.address,
                  description: property.description || "",
                  total_floors: property.total_floors,
                }}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                isLoading={saving}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
