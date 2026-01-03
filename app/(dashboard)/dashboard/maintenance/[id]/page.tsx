"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { MaintenanceRequest, Unit, Property, Tenant } from "@/types";
import { useFeature } from "@/hooks";
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Phone,
  DollarSign,
  Calendar,
  Edit,
  ArrowRight,
} from "lucide-react";

interface MaintenanceWithRelations extends MaintenanceRequest {
  unit: Unit & { property: Property };
  tenant?: Tenant;
}

const statusConfig = {
  pending: {
    label: "未対応",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  in_progress: {
    label: "対応中",
    icon: Wrench,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  completed: {
    label: "完了",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Цуцлах",
    icon: XCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const priorityConfig = {
  low: { label: "低", color: "bg-gray-100 text-gray-700" },
  normal: { label: "中", color: "bg-blue-100 text-blue-700" },
  high: { label: "高", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "緊急", color: "bg-red-100 text-red-700" },
};

export default function MaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const hasMaintenanceVendor = useFeature("maintenance_vendor");

  const [request, setRequest] = useState<MaintenanceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: "" as MaintenanceRequest["status"],
    vendor_name: "",
    vendor_phone: "",
    estimated_cost: 0,
    actual_cost: 0,
    scheduled_date: "",
    completed_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from("maintenance_requests")
      .select(
        `
                *,
                unit:units(*, property:properties(*)),
                tenant:tenants(*)
            `
      )
      .eq("id", requestId)
      .single();

    if (!data) {
      router.push("/dashboard/maintenance");
      return;
    }

    setRequest(data as MaintenanceWithRelations);
    setEditData({
      status: data.status,
      vendor_name: data.vendor_name || "",
      vendor_phone: data.vendor_phone || "",
      estimated_cost: data.estimated_cost || 0,
      actual_cost: data.actual_cost || 0,
      scheduled_date: data.scheduled_date || "",
      completed_date: data.completed_date || "",
      notes: data.notes || "",
    });
    setLoading(false);
  };

  const handleUpdateRequest = async () => {
    const supabase = createClient();

    await supabase
      .from("maintenance_requests")
      .update({
        status: editData.status,
        vendor_name: editData.vendor_name || null,
        vendor_phone: editData.vendor_phone || null,
        estimated_cost: editData.estimated_cost || null,
        actual_cost: editData.actual_cost || null,
        scheduled_date: editData.scheduled_date || null,
        completed_date:
          editData.status === "completed"
            ? editData.completed_date || new Date().toISOString().split("T")[0]
            : null,
        notes: editData.notes || null,
      })
      .eq("id", requestId);

    setEditing(false);
    fetchRequest();
  };

  const handleStatusChange = async (
    newStatus: MaintenanceRequest["status"]
  ) => {
    const supabase = createClient();

    const updates: Partial<MaintenanceRequest> = { status: newStatus };
    if (newStatus === "completed") {
      updates.completed_date = new Date().toISOString().split("T")[0];
    }

    await supabase
      .from("maintenance_requests")
      .update(updates)
      .eq("id", requestId);

    fetchRequest();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  if (loading || !request) {
    return (
      <>
        <Header title="Засвартай詳細" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  const status = statusConfig[request.status];
  const priority = priorityConfig[request.priority];
  const StatusIcon = status.icon;

  return (
    <>
      <Header title="Засвартай詳細" showBack />
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-3 ${status.bg}`}>
                      <StatusIcon className={`h-6 w-6 ${status.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{request.title}</h2>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${priority.color}`}
                        >
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-gray-500">
                        {request.unit.property.name} -{" "}
                        {request.unit.unit_number}
                      </p>
                      {request.category && (
                        <span className="text-sm text-gray-400">
                          {request.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Status Progression */}
                {request.status !== "cancelled" && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    {["pending", "in_progress", "completed"].map((s, i) => {
                      const isActive = request.status === s;
                      const isPast =
                        ["pending", "in_progress", "completed"].indexOf(
                          request.status
                        ) > i;
                      const config =
                        statusConfig[s as keyof typeof statusConfig];

                      return (
                        <div key={s} className="flex items-center">
                          {i > 0 && (
                            <ArrowRight className="mx-2 h-4 w-4 text-gray-300" />
                          )}
                          <button
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? `${config.bg} ${config.color}`
                                : isPast
                                ? "bg-gray-100 text-gray-500"
                                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                            }`}
                            onClick={() =>
                              handleStatusChange(
                                s as MaintenanceRequest["status"]
                              )
                            }
                            disabled={isPast}
                          >
                            {config.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {request.description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">詳細説明</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-gray-700">
                    {request.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Vendor Info (if feature enabled) */}
            {hasMaintenanceVendor && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-4 w-4" />
                    業者・コスト情報
                  </CardTitle>
                  {!editing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      засах
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>業者名</Label>
                          <Input
                            value={editData.vendor_name}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                vendor_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>業者電話番号</Label>
                          <Input
                            value={editData.vendor_phone}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                vendor_phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>見積金額</Label>
                          <Input
                            type="number"
                            value={editData.estimated_cost}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                estimated_cost: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>実費</Label>
                          <Input
                            type="number"
                            value={editData.actual_cost}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                actual_cost: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>予定日</Label>
                          <Input
                            type="date"
                            value={editData.scheduled_date}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                scheduled_date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>完了日</Label>
                          <Input
                            type="date"
                            value={editData.completed_date}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                completed_date: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Тэмдэглэл</Label>
                        <textarea
                          className="min-h-[80px] w-full rounded-md border p-2"
                          value={editData.notes}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              notes: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateRequest}>Хадгалах</Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditing(false)}
                        >
                          Цуцлах
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm text-gray-500">業者名</div>
                        <div className="font-medium">
                          {request.vendor_name || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          業者電話番号
                        </div>
                        <div className="font-medium">
                          {request.vendor_phone ? (
                            <a
                              href={`tel:${request.vendor_phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {request.vendor_phone}
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">見積金額</div>
                        <div className="font-medium">
                          {request.estimated_cost
                            ? `¥${formatCurrency(request.estimated_cost)}`
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">実費</div>
                        <div className="font-medium">
                          {request.actual_cost
                            ? `¥${formatCurrency(request.actual_cost)}`
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">予定日</div>
                        <div className="font-medium">
                          {request.scheduled_date
                            ? formatDate(request.scheduled_date)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">完了日</div>
                        <div className="font-medium">
                          {request.completed_date
                            ? formatDate(request.completed_date)
                            : "-"}
                        </div>
                      </div>
                      {request.notes && (
                        <div className="sm:col-span-2">
                          <div className="text-sm text-gray-500">Тэмдэглэл</div>
                          <div className="font-medium whitespace-pre-wrap">
                            {request.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">リクエスト情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">作成日</div>
                  <div className="font-medium">
                    {formatDate(request.created_at)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">最終更新</div>
                  <div className="font-medium">
                    {formatDate(request.updated_at)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Info */}
            {request.tenant && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    依頼者情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">名前</div>
                    <div className="font-medium">{request.tenant.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">電話番号</div>
                    <div className="font-medium">
                      <a
                        href={`tel:${request.tenant.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {request.tenant.phone}
                      </a>
                    </div>
                  </div>
                  <Link href={`/dashboard/tenants/${request.tenant.id}`}>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      テナント詳細を見る
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Unit Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  物件・ユニット情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">物件</div>
                  <div className="font-medium">
                    {request.unit.property.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ユニット</div>
                  <div className="font-medium">{request.unit.unit_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">住所</div>
                  <div className="font-medium">
                    {request.unit.property.address}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {request.status !== "cancelled" &&
              request.status !== "completed" && (
                <Card>
                  <CardContent className="pt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleStatusChange("cancelled")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Цуцлах
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
