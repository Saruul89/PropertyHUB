"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useFeature } from "@/hooks";
import {
  TenantMeterSubmission,
  FeeType,
  Unit,
  Tenant,
  MeterSubmissionStatus,
} from "@/types";
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Image as ImageIcon,
} from "lucide-react";

interface SubmissionWithDetails extends TenantMeterSubmission {
  fee_type?: FeeType;
  unit?: Unit & { property?: { name: string } };
  tenant?: Tenant;
}

const statusConfig: Record<
  MeterSubmissionStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "承認待ち",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "承認済み",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: { label: "却下", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function MeterSubmissionsPage() {
  const { companyId, user } = useAuth();
  const hasMeterReadings = useFeature("meter_readings");
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    MeterSubmissionStatus | "all"
  >("pending");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithDetails | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (companyId) {
      fetchSubmissions();
    }
  }, [companyId]);

  const fetchSubmissions = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tenant_meter_submissions")
      .select(
        `
                *,
                fee_types(*),
                units(*, properties(name, company_id)),
                tenants(*)
            `
      )
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      const filtered = data
        .filter((s: Record<string, unknown>) => {
          const unit = s.units as Record<string, unknown> | null;
          const property = unit?.properties as Record<string, unknown> | null;
          return property?.company_id === companyId;
        })
        .map((s: Record<string, unknown>) => ({
          ...s,
          fee_type: s.fee_types as FeeType | undefined,
          unit: s.units
            ? {
                ...(s.units as Unit),
                property: (s.units as Record<string, unknown>).properties as
                  | { name: string }
                  | undefined,
              }
            : undefined,
          tenant: s.tenants as Tenant | undefined,
        })) as SubmissionWithDetails[];
      setSubmissions(filtered);
    }
    setLoading(false);
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
      submission.unit?.unit_number.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (submission: SubmissionWithDetails) => {
    setProcessing(true);
    const supabase = createClient();

    // Get last reading for this unit and fee type
    const { data: lastReading } = await supabase
      .from("meter_readings")
      .select("current_reading")
      .eq("unit_id", submission.unit_id)
      .eq("fee_type_id", submission.fee_type_id)
      .order("reading_date", { ascending: false })
      .limit(1)
      .single();

    const previousReading = lastReading?.current_reading ?? 0;
    const feeType = submission.fee_type;
    const unitPrice = feeType?.default_unit_price ?? 0;

    // Create meter reading
    const { data: meterReading, error: readingError } = await supabase
      .from("meter_readings")
      .insert({
        unit_id: submission.unit_id,
        fee_type_id: submission.fee_type_id,
        reading_date: new Date().toISOString().split("T")[0],
        previous_reading: previousReading,
        current_reading: submission.submitted_reading,
        unit_price: unitPrice,
        recorded_by: user?.id,
        notes: `入居者提出を承認 (ID: ${submission.id})`,
      })
      .select()
      .single();

    if (readingError) {
      alert("メーター記録の作成に失敗しました");
      setProcessing(false);
      return;
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from("tenant_meter_submissions")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        meter_reading_id: meterReading.id,
      })
      .eq("id", submission.id);

    if (updateError) {
      alert("Статус更新に失敗しました");
    } else {
      setSubmissions(
        submissions.map((s) =>
          s.id === submission.id
            ? {
                ...s,
                status: "approved" as MeterSubmissionStatus,
                meter_reading_id: meterReading.id,
              }
            : s
        )
      );
      setSelectedSubmission(null);
    }
    setProcessing(false);
  };

  const handleReject = async (submission: SubmissionWithDetails) => {
    if (!rejectionReason.trim()) {
      alert("却下理由を入力してください");
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("tenant_meter_submissions")
      .update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", submission.id);

    if (error) {
      alert("Статус更新に失敗しました");
    } else {
      setSubmissions(
        submissions.map((s) =>
          s.id === submission.id
            ? {
                ...s,
                status: "rejected" as MeterSubmissionStatus,
                rejection_reason: rejectionReason,
              }
            : s
        )
      );
      setSelectedSubmission(null);
      setRejectionReason("");
    }
    setProcessing(false);
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  if (!hasMeterReadings) {
    return (
      <>
        <Header title="入居者メーター提出" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">メーター機能は利用できません</p>
              <p className="text-sm text-gray-500">
                この機能を有効にするには管理者にお問い合わせください
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="入居者メーター提出" showBack />
      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <p className="text-sm text-gray-500">承認待ち</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {submissions.filter((s) => s.status === "approved").length}
              </div>
              <p className="text-sm text-gray-500">承認済み（今月）</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {submissions.filter((s) => s.status === "rejected").length}
              </div>
              <p className="text-sm text-gray-500">却下</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="入居者名、өрөөний дугаарで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as MeterSubmissionStatus | "all")
              }
            >
              <option value="all">すべて</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center text-gray-500">Ачааллаж байна...</div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">
                {search || statusFilter !== "all"
                  ? "該当する提出がありません"
                  : "入居者からの提出がありません"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    入居者
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    物件・部屋
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    料金タイプ
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    提出値
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    提出日時
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubmissions.map((submission) => {
                  const statusInfo = statusConfig[submission.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        {submission.tenant?.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p>{submission.unit?.property?.name}</p>
                          <p className="text-gray-500">
                            {submission.unit?.unit_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {submission.fee_type?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {submission.submitted_reading.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(submission.submitted_at).toLocaleString(
                          "ja-JP"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>メーター提出の詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">入居者</Label>
                    <p className="font-medium">
                      {selectedSubmission.tenant?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">部屋</Label>
                    <p className="font-medium">
                      {selectedSubmission.unit?.property?.name} -{" "}
                      {selectedSubmission.unit?.unit_number}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">料金タイプ</Label>
                    <p className="font-medium">
                      {selectedSubmission.fee_type?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">提出値</Label>
                    <p className="text-lg font-bold">
                      {selectedSubmission.submitted_reading.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">提出日時</Label>
                    <p className="font-medium">
                      {new Date(selectedSubmission.submitted_at).toLocaleString(
                        "ja-JP"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Статус</Label>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        statusConfig[selectedSubmission.status].color
                      }`}
                    >
                      {statusConfig[selectedSubmission.status].label}
                    </span>
                  </div>
                </div>

                {selectedSubmission.photo_url && (
                  <div>
                    <Label className="text-gray-500">写真</Label>
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      <img
                        src={selectedSubmission.photo_url}
                        alt="メーター写真"
                        className="h-48 w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedSubmission.notes && (
                  <div>
                    <Label className="text-gray-500">メモ</Label>
                    <p className="text-sm">{selectedSubmission.notes}</p>
                  </div>
                )}

                {selectedSubmission.status === "rejected" &&
                  selectedSubmission.rejection_reason && (
                    <div className="rounded-lg bg-red-50 p-3">
                      <Label className="text-red-700">却下理由</Label>
                      <p className="text-sm text-red-600">
                        {selectedSubmission.rejection_reason}
                      </p>
                    </div>
                  )}

                {selectedSubmission.status === "pending" && (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <Label htmlFor="rejectionReason">
                        却下理由（却下する場合）
                      </Label>
                      <Input
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="数値が不正、写真が不鮮明など"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleReject(selectedSubmission)}
                        disabled={processing}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        却下
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(selectedSubmission)}
                        disabled={processing}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        承認
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(null);
                      setRejectionReason("");
                    }}
                  >
                    閉じる
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
