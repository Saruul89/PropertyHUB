"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MaintenanceRequest,
  Unit,
  Property,
  Tenant,
  MaintenanceStatus,
} from "@/types";
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Edit,
  ArrowRight,
} from "lucide-react";

export interface MaintenanceWithRelations extends MaintenanceRequest {
  unit: Unit & { property: Property };
  tenant?: Tenant;
}

export interface MaintenanceEditData {
  status: MaintenanceStatus;
  vendor_name: string;
  vendor_phone: string;
  estimated_cost: number;
  actual_cost: number;
  scheduled_date: string;
  completed_date: string;
  notes: string;
}

export interface MaintenanceDetailProps {
  request: MaintenanceWithRelations;
  showVendorSection?: boolean;
  onStatusChange: (status: MaintenanceStatus) => Promise<void>;
  onUpdate: (data: Partial<MaintenanceEditData>) => Promise<void>;
}

const statusConfig = {
  pending: {
    label: "Хүлээгдэж буй",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  in_progress: {
    label: "Шийдвэрлэж буй",
    icon: Wrench,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  completed: {
    label: "Дууссан",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Цуцлагдсан",
    icon: XCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const priorityConfig = {
  low: { label: "Бага", color: "bg-gray-100 text-gray-700" },
  normal: { label: "Дунд", color: "bg-blue-100 text-blue-700" },
  high: { label: "Өндөр", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Яаралтай", color: "bg-red-100 text-red-700" },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ja-JP").format(amount);
};

export function MaintenanceDetail({
  request,
  showVendorSection = false,
  onStatusChange,
  onUpdate,
}: MaintenanceDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<MaintenanceEditData>({
    status: request.status,
    vendor_name: request.vendor_name || "",
    vendor_phone: request.vendor_phone || "",
    estimated_cost: request.estimated_cost || 0,
    actual_cost: request.actual_cost || 0,
    scheduled_date: request.scheduled_date || "",
    completed_date: request.completed_date || "",
    notes: request.notes || "",
  });

  const status = statusConfig[request.status];
  const priority = priorityConfig[request.priority];
  const StatusIcon = status.icon;

  const handleUpdateRequest = async () => {
    await onUpdate({
      ...editData,
      completed_date:
        editData.status === "completed"
          ? editData.completed_date || new Date().toISOString().split("T")[0]
          : editData.completed_date,
    });
    setEditing(false);
  };

  const handleStatusButtonClick = async (newStatus: MaintenanceStatus) => {
    await onStatusChange(newStatus);
  };

  return (
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
                    {request.unit.property.name} - {request.unit.unit_number}
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
                {(["pending", "in_progress", "completed"] as const).map(
                  (s, i) => {
                    const isActive = request.status === s;
                    const isPast =
                      ["pending", "in_progress", "completed"].indexOf(
                        request.status
                      ) > i;
                    const config = statusConfig[s];

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
                          onClick={() => handleStatusButtonClick(s)}
                          disabled={isPast}
                        >
                          {config.label}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {request.description && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Дэлгэрэнгүй тайлбар</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">
                {request.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Vendor Info (if feature enabled) */}
        {showVendorSection && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Гүйцэтгэгч · Зардлын мэдээлэл
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
                      <Label>Гүйцэтгэгчийн нэр</Label>
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
                      <Label>Гүйцэтгэгчийн утас</Label>
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
                      <Label>Төсөвт өртөг</Label>
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
                      <Label>Бодит зардал</Label>
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
                      <Label>Товлосон огноо</Label>
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
                      <Label>Дууссан огноо</Label>
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
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Цуцлах
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-gray-500">Гүйцэтгэгчийн нэр</div>
                    <div className="font-medium">
                      {request.vendor_name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Гүйцэтгэгчийн утас</div>
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
                    <div className="text-sm text-gray-500">Төсөвт өртөг</div>
                    <div className="font-medium">
                      {request.estimated_cost
                        ? `¥${formatCurrency(request.estimated_cost)}`
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Бодит зардал</div>
                    <div className="font-medium">
                      {request.actual_cost
                        ? `¥${formatCurrency(request.actual_cost)}`
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Товлосон огноо</div>
                    <div className="font-medium">
                      {request.scheduled_date
                        ? formatDate(request.scheduled_date)
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Дууссан огноо</div>
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
            <CardTitle className="text-base">Хүсэлтийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Үүсгэсэн огноо</div>
              <div className="font-medium">
                {formatDate(request.created_at)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Сүүлийн шинэчлэл</div>
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
                Хүсэлт гаргагчийн мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Нэр</div>
                <div className="font-medium">{request.tenant.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Утас</div>
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
                  Түрээслэгчийн дэлгэрэнгүй
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
              Хөрөнгө · Өрөөний мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Хөрөнгө</div>
              <div className="font-medium">{request.unit.property.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Өрөө</div>
              <div className="font-medium">{request.unit.unit_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Хаяг</div>
              <div className="font-medium">{request.unit.property.address}</div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {request.status !== "cancelled" && request.status !== "completed" && (
          <Card>
            <CardContent className="pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleStatusButtonClick("cancelled")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Цуцлах
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
