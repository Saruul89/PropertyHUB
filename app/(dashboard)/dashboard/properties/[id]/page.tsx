"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyStats } from "@/components/features/properties";
import { UnitGrid, UnitCard } from "@/components/features/units";
import { createClient } from "@/lib/supabase/client";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { Property, Unit } from "@/types";
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Grid3X3,
  LayoutList,
} from "lucide-react";

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "cards">("grid");

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    const [propertyRes, unitsRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", propertyId).single(),
      supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number"),
    ]);

    if (propertyRes.error || !propertyRes.data) {
      router.push("/dashboard/properties");
      return;
    }

    setProperty(propertyRes.data);
    setUnits(unitsRes.data || []);
    setLoading(false);
  };

  const handleDeleteUnit = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", id);

    if (!error) {
      setUnits(units.filter((u) => u.id !== id));
    }
  };

  if (loading || !property) {
    return (
      <>
        <Header title="Барилгын дэлгэрэнгүй" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  // 統計を計算
  const stats = {
    totalUnits: units.length,
    occupiedUnits: units.filter((u) => u.status === "occupied").length,
    vacantUnits: units.filter((u) => u.status === "vacant").length,
    maintenanceUnits: units.filter((u) => u.status === "maintenance").length,
  };

  return (
    <>
      <Header title="Барилгын дэлгэрэнгүй" showBack />
      <div className="p-6 space-y-6">
        {/* 物件情報ヘッダー */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{property.name}</h1>
                    <span className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
                      {PROPERTY_TYPE_LABELS[property.property_type]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address}</span>
                  </div>
                  {property.description && (
                    <p className="mt-2 text-gray-600">{property.description}</p>
                  )}
                </div>
              </div>
              <Link href={`/dashboard/properties/${propertyId}/edit`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  засах
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 統計 */}
        <PropertyStats {...stats} />

        {/* タブ */}
        <Tabs defaultValue="units">
          <TabsList>
            <TabsTrigger value="units">Өрөөний удирдлага</TabsTrigger>
            <TabsTrigger value="tenants">Оршин суугчид</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Өрөөний жагсаалт</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "cards" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("cards")}
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                    </div>
                    <Link
                      href={`/dashboard/properties/${propertyId}/units/bulk`}
                    >
                      <Button variant="outline" size="sm">
                        Нэг дор нэмэх
                      </Button>
                    </Link>
                    <Link href={`/dashboard/properties/${propertyId}/units`}>
                      <Button size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        Өрөө нэмэх
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {units.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p className="mb-4 text-gray-600">
                      Өрөө бүртгэгдээгүй байна
                    </p>
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/dashboard/properties/${propertyId}/units/bulk`}
                      >
                        <Button variant="outline">Нэг дор нэмэх</Button>
                      </Link>
                      <Link href={`/dashboard/properties/${propertyId}/units`}>
                        <Button>Өрөө нэмэх</Button>
                      </Link>
                    </div>
                  </div>
                ) : viewMode === "grid" ? (
                  <UnitGrid units={units} propertyId={propertyId} />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {units.map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        propertyId={propertyId}
                        onDelete={handleDeleteUnit}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Оршин суугчид</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Барилгын оршин суугчидыг{" "}
                  <Link
                    href="/dashboard/tenants"
                    className="text-blue-600 hover:underline"
                  >
                    Оршин суугчидын удирдлага
                  </Link>{" "}
                  аас шалгаж болно
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
