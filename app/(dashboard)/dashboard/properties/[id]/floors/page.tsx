"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { Floor, Property, FloorInput } from "@/types";
import { FloorList, FloorForm } from "@/components/features/floor-plan";
import { useFeature } from "@/hooks";
import { Plus, AlertTriangle } from "lucide-react";

export default function FloorsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const hasFloorPlan = useFeature("floor_plan");

  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | undefined>(
    undefined
  );
  const [deletingFloorId, setDeletingFloorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch property
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!propertyData) {
      router.push("/dashboard/properties");
      return;
    }

    setProperty(propertyData);

    // Fetch floors
    const { data: floorsData } = await supabase
      .from("floors")
      .select("*")
      .eq("property_id", propertyId)
      .order("floor_number", { ascending: true });

    setFloors(floorsData || []);
    setLoading(false);
  };

  const handleCreateFloor = async (data: FloorInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("floors").insert({
      property_id: propertyId,
      floor_number: data.floor_number,
      name: data.name || `${data.floor_number}F`,
      plan_width: data.plan_width || 800,
      plan_height: data.plan_height || 600,
      plan_image_url: data.plan_image_url || null,
    });

    setIsSubmitting(false);

    if (error) {
      throw new Error(error.message);
    }

    setShowForm(false);
    fetchData();
  };

  const handleUpdateFloor = async (data: FloorInput) => {
    if (!editingFloor) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("floors")
      .update({
        floor_number: data.floor_number,
        name: data.name || `${data.floor_number}F`,
        plan_width: data.plan_width || 800,
        plan_height: data.plan_height || 600,
        plan_image_url: data.plan_image_url || null,
      })
      .eq("id", editingFloor.id);

    setIsSubmitting(false);

    if (error) {
      throw new Error(error.message);
    }

    setEditingFloor(undefined);
    fetchData();
  };

  const handleDeleteFloor = async () => {
    if (!deletingFloorId) return;

    const supabase = createClient();

    // First delete related units
    await supabase.from("units").delete().eq("floor_id", deletingFloorId);

    // Then delete floor
    await supabase.from("floors").delete().eq("id", deletingFloorId);

    setDeletingFloorId(null);
    fetchData();
  };

  const handleFloorSelect = (floor: Floor) => {
    router.push(
      `/dashboard/properties/${propertyId}/floor-plan?floor=${floor.id}`
    );
  };

  if (loading) {
    return (
      <>
        <Header title="Давхар管理" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  if (!hasFloorPlan) {
    return (
      <>
        <Header title="Давхар管理" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
              <p className="text-gray-500">
                フロアプラン機能が有効になっていません。
              </p>
              <p className="mt-2 text-sm text-gray-400">
                この機能を使用するには、会社設定でフロアプラン機能を有効にしてください。
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${property?.name || ""} - Давхар管理`}
        showBack
        action={
          !showForm &&
          !editingFloor && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Давхарを追加
            </Button>
          )
        }
      />
      <div className="p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Form for Add/Edit */}
          {(showForm || editingFloor) && (
            <FloorForm
              floor={editingFloor}
              onSubmit={editingFloor ? handleUpdateFloor : handleCreateFloor}
              onCancel={() => {
                setShowForm(false);
                setEditingFloor(undefined);
              }}
              isLoading={isSubmitting}
            />
          )}

          {/* Floor List */}
          {!showForm && !editingFloor && (
            <Card>
              <CardHeader>
                <CardTitle>登録済みのДавхар</CardTitle>
              </CardHeader>
              <CardContent>
                <FloorList
                  floors={floors}
                  onSelect={handleFloorSelect}
                  onEdit={(floor) => setEditingFloor(floor)}
                  onDelete={(floorId) => setDeletingFloorId(floorId)}
                  showActions
                />

                {floors.length === 0 && (
                  <div className="mt-4">
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      最初のДавхарを追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingFloorId}
        onOpenChange={() => setDeletingFloorId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Давхарを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このДавхарに関連するユニットも削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFloor}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
