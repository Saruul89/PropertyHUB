"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Property } from "@/types";
import { Building2, Map, Layers } from "lucide-react";

export default function FloorPlansPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.user.id)
      .single();

    if (!companyUser) return;

    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setProperties(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Header title="フロアプラン" />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="フロアプラン" />
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-600">
            物件を選択してフロアプランを管理します。ユニットの配置を視覚的に確認・засахできます。
          </p>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-500">物件がありません</p>
              <Button onClick={() => router.push("/dashboard/properties/new")}>
                物件を登録
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/dashboard/floor-plans/${property.id}`}
              >
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {property.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>{property.total_floors} Давхар</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        <span>{property.total_units} ユニット</span>
                      </div>
                      <div className="truncate text-gray-500">
                        {property.address}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          property.floor_plan_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {property.floor_plan_enabled
                          ? "Давхарын план хүчинтэй"
                          : "Давхарын план тохируулаагүй"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
