"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FloorPlanEditor } from "@/components/features/floor-plan/FloorPlanEditor";
import { createClient } from "@/lib/supabase/client";
import { Property } from "@/types";
import { AlertCircle } from "lucide-react";

export default function FloorPlanEditorPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    const supabase = createClient();

    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!propertyData) {
      router.push("/dashboard/floor-plans");
      return;
    }

    setProperty(propertyData);
    setLoading(false);
  };

  const handleEnableFloorPlan = async () => {
    const supabase = createClient();
    await supabase
      .from("properties")
      .update({ floor_plan_enabled: true })
      .eq("id", propertyId);

    setProperty({ ...property!, floor_plan_enabled: true });
  };

  if (loading) {
    return (
      <>
        <Header title="Давхрын зураг" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`Давхрын зураг - ${property?.name}`} showBack />
      <div className="p-6">
        {!property?.floor_plan_enabled && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                Давхрын зураг идэвхжүүлээгүй байна
              </span>
            </div>
            <p className="mt-1 text-sm text-yellow-700">
              Давхрын зураг ашиглахын тулд идэвхжүүлэх шаардлагатай.
            </p>
            <Button onClick={handleEnableFloorPlan} className="mt-3" size="sm">
              Давхрын зураг идэвхжүүлэх
            </Button>
          </div>
        )}

        <FloorPlanEditor propertyId={propertyId} />
      </div>
    </>
  );
}
