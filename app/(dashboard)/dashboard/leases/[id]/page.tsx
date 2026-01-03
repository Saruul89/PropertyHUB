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
import { Lease, Tenant, Unit, Property, Document, LeaseTerms } from "@/types";
import { useFeature } from "@/hooks";
import {
  BillingHistory,
  LeaseTermsDisplay,
} from "@/components/features/lease-detail";
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  Trash2,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface LeaseWithRelations extends Lease {
  tenant: Tenant;
  unit: Unit & { property: Property };
}

const statusConfig = {
  active: {
    label: "契約中",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  pending: {
    label: "審査中",
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  expired: {
    label: "満了",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  terminated: {
    label: "解約済み",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export default function LeaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = params.id as string;
  const hasLeaseDocuments = useFeature("lease_documents");

  const [lease, setLease] = useState<LeaseWithRelations | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    monthly_rent: 0,
    deposit: 0,
    end_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchLease();
  }, [leaseId]);

  const fetchLease = async () => {
    const supabase = createClient();

    const { data: leaseData } = await supabase
      .from("leases")
      .select(
        `
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `
      )
      .eq("id", leaseId)
      .single();

    if (!leaseData) {
      router.push("/dashboard/leases");
      return;
    }

    setLease(leaseData as LeaseWithRelations);
    setEditData({
      monthly_rent: leaseData.monthly_rent,
      deposit: leaseData.deposit,
      end_date: leaseData.end_date || "",
      notes: leaseData.notes || "",
    });

    // Fetch documents
    const { data: docsData } = await supabase
      .from("documents")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false });

    setDocuments(docsData || []);
    setLoading(false);
  };

  const handleUpdateLease = async () => {
    const supabase = createClient();

    await supabase
      .from("leases")
      .update({
        monthly_rent: editData.monthly_rent,
        deposit: editData.deposit,
        end_date: editData.end_date || null,
        notes: editData.notes || null,
      })
      .eq("id", leaseId);

    setEditing(false);
    fetchLease();
  };

  const handleTerminateLease = async () => {
    if (!confirm("この契約を解約しますか？")) return;

    const supabase = createClient();

    await supabase
      .from("leases")
      .update({ status: "terminated" })
      .eq("id", leaseId);

    // Set unit back to vacant
    if (lease) {
      await supabase
        .from("units")
        .update({ status: "vacant" })
        .eq("id", lease.unit_id);
    }

    fetchLease();
  };

  const handleRenewLease = async () => {
    if (!lease) return;

    const supabase = createClient();

    // Update current lease to expired
    await supabase
      .from("leases")
      .update({ status: "expired" })
      .eq("id", leaseId);

    // Create new lease
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    await supabase.from("leases").insert({
      tenant_id: lease.tenant_id,
      unit_id: lease.unit_id,
      company_id: lease.company_id,
      start_date: new Date().toISOString().split("T")[0],
      end_date: newEndDate.toISOString().split("T")[0],
      monthly_rent: lease.monthly_rent,
      deposit: lease.deposit,
      payment_due_day: lease.payment_due_day,
      status: "active",
    });

    router.push("/dashboard/leases");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lease) return;

    setUploading(true);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const filePath = `leases/${leaseId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      alert("アップロードに失敗しました");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    await supabase.from("documents").insert({
      company_id: lease.company_id,
      lease_id: leaseId,
      tenant_id: lease.tenant_id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.user.id,
    });

    setUploading(false);
    fetchLease();
  };

  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    if (!confirm("このドキュメントを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("documents").delete().eq("id", docId);
    fetchLease();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  if (loading || !lease) {
    return (
      <>
        <Header title="契約詳細" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  const status = statusConfig[lease.status];
  const StatusIcon = status.icon;

  return (
    <>
      <Header
        title="契約詳細"
        showBack
        action={
          lease.status === "active" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRenewLease}>
                契約更新
              </Button>
              <Button variant="destructive" onClick={handleTerminateLease}>
                解約
              </Button>
            </div>
          )
        }
      />
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${status.bg}`}>
                    <StatusIcon className={`h-6 w-6 ${status.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{lease.tenant.name}</h2>
                    <p className="text-gray-500">
                      {lease.unit.property.name} - {lease.unit.unit_number}
                    </p>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  契約詳細
                </CardTitle>
                {lease.status === "active" && !editing && (
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
                        <Label>Сарын түрээс</Label>
                        <Input
                          type="number"
                          value={editData.monthly_rent}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              monthly_rent: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>保証金</Label>
                        <Input
                          type="number"
                          value={editData.deposit}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              deposit: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>契約終了日</Label>
                      <Input
                        type="date"
                        value={editData.end_date}
                        onChange={(e) =>
                          setEditData({ ...editData, end_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Тэмдэглэл</Label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border p-2"
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData({ ...editData, notes: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateLease}>Хадгалах</Button>
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
                      <div className="text-sm text-gray-500">契約開始日</div>
                      <div className="font-medium">
                        {formatDate(lease.start_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">契約終了日</div>
                      <div className="font-medium">
                        {lease.end_date ? formatDate(lease.end_date) : "無期限"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Сарын түрээс</div>
                      <div className="font-medium">
                        ¥{formatCurrency(lease.monthly_rent)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">保証金</div>
                      <div className="font-medium">
                        ¥{formatCurrency(lease.deposit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">支払期日</div>
                      <div className="font-medium">
                        毎月{lease.payment_due_day}日
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">作成日</div>
                      <div className="font-medium">
                        {formatDate(lease.created_at)}
                      </div>
                    </div>
                    {lease.notes && (
                      <div className="sm:col-span-2">
                        <div className="text-sm text-gray-500">Тэмдэглэл</div>
                        <div className="font-medium whitespace-pre-wrap">
                          {lease.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lease Terms */}
            {lease.terms && Object.keys(lease.terms).length > 0 && (
              <LeaseTermsDisplay terms={lease.terms as LeaseTerms} />
            )}

            {/* Billing History */}
            <BillingHistory leaseId={leaseId} />

            {/* Documents */}
            {hasLeaseDocuments && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      契約書類
                    </span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <span className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Upload className="h-4 w-4" />
                        {uploading ? "アップロード中..." : "アップロード"}
                      </span>
                    </label>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                      書類がありません
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{doc.file_name}</div>
                              <div className="text-xs text-gray-500">
                                {doc.file_size
                                  ? `${(doc.file_size / 1024).toFixed(1)} KB`
                                  : ""}{" "}
                                - {formatDate(doc.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteDocument(doc.id, doc.file_url)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  テナント情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">名前</div>
                  <div className="font-medium">{lease.tenant.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">電話番号</div>
                  <div className="font-medium">{lease.tenant.phone}</div>
                </div>
                {lease.tenant.email && (
                  <div>
                    <div className="text-sm text-gray-500">メール</div>
                    <div className="font-medium">{lease.tenant.email}</div>
                  </div>
                )}
                <Link href={`/dashboard/tenants/${lease.tenant.id}`}>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    テナント詳細を見る
                  </Button>
                </Link>
              </CardContent>
            </Card>

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
                  <div className="font-medium">{lease.unit.property.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ユニット</div>
                  <div className="font-medium">{lease.unit.unit_number}</div>
                </div>
                {lease.unit.area_sqm && (
                  <div>
                    <div className="text-sm text-gray-500">Талбай</div>
                    <div className="font-medium">{lease.unit.area_sqm} m²</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">住所</div>
                  <div className="font-medium">
                    {lease.unit.property.address}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
