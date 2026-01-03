"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { FloorPlanEditor } from "@/components/features/floor-plan";
import { createClient } from "@/lib/supabase/client";
import { useFeature } from "@/hooks/use-feature";
import { Property } from "@/types";
import { AlertCircle } from "lucide-react";

export default function FloorPlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFloorPlan = useFeature("floor_plan");

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!data) {
      router.push("/dashboard/properties");
      return;
    }

    setProperty(data);
    setLoading(false);
  };

  if (!hasFloorPlan) {
    return (
      <>
        <Header title="フロアプランзасах" showBack />
        <div className="p-6">
          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                フロアプラン機能は有効化されていません
              </span>
            </div>
            <p className="mt-1 text-sm text-yellow-700">
              この機能を使用するには、プランのアップグレードが必要です。
            </p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="フロアプランзасах" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`フロアプランзасах - ${property?.name}`} showBack />
      <div className="p-6">
        <FloorPlanEditor
          propertyId={propertyId}
          propertyName={property?.name || ""}
        />
      </div>
    </>
  );
}
