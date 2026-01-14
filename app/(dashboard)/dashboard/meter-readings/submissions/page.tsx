"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useFeature } from "@/hooks";
import { toast } from "sonner";
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
    label: "Хүлээгдэж буй",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Зөвшөөрсөн",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Татгалзсан",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
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
        notes: `Tenant submitted (ID: ${submission.id})`,
      })
      .select()
      .single();

    if (readingError) {
      toast.error("Тоолуурын бүртгэл үүсгэхэд алдаа гарлаа");
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
      toast.error("Төлөв шинэчлэхэд алдаа гарлаа");
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
      toast.success("Амжилттай зөвшөөрлөө");
    }
    setProcessing(false);
  };

  const handleReject = async (submission: SubmissionWithDetails) => {
    if (!rejectionReason.trim()) {
      toast.error("Татгалзах шалтгаан оруулна уу");
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
      toast.error("Төлөв шинэчлэхэд алдаа гарлаа");
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
      toast.success("Татгалзлаа");
    }
    setProcessing(false);
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  // Handle Escape key to close modal
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedSubmission) {
        setSelectedSubmission(null);
        setRejectionReason("");
      }
    },
    [selectedSubmission]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [handleEscapeKey]);

  if (!hasMeterReadings) {
    return (
      <>
        <Header title="Оршин суугчийн тоолуурын илгээлт" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Тоолуурын функц идэвхгүй байна</p>
              <p className="text-sm text-gray-500">
                Энэ функцийг идэвхжүүлэхийн тулд админтай холбогдоно уу
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Оршин суугчийн тоолуурын илгээлт" showBack />
      <div className="p-4 md:p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <p className="text-sm text-gray-500">Хүлээгдэж буй</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {submissions.filter((s) => s.status === "approved").length}
              </div>
              <p className="text-sm text-gray-500">Зөвшөөрсөн (энэ сар)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {submissions.filter((s) => s.status === "rejected").length}
              </div>
              <p className="text-sm text-gray-500">Татгалзсан</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Оршин суугч, өрөөний дугаараар хайх..."
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
              <option value="all">Бүгд</option>
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
                  ? "Тохирох илгээлт олдсонгүй"
                  : "Оршин суугчаас илгээлт байхгүй"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Оршин суугч
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Барилга・Өрөө
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Төлбөрийн төрөл
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Илгээсэн утга
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Илгээсэн огноо
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 md:px-6">
                    Төлөв
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubmissions.map((submission) => {
                  const statusInfo = statusConfig[submission.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium md:px-6">
                        {submission.tenant?.name}
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <div className="text-sm">
                          <p>{submission.unit?.property?.name}</p>
                          <p className="text-gray-500">
                            {submission.unit?.unit_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {submission.fee_type?.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono md:px-6">
                        {submission.submitted_reading.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm md:px-6">
                        {new Date(submission.submitted_at).toLocaleString(
                          "mn-MN"
                        )}
                      </td>
                      <td className="px-4 py-4 text-center md:px-6">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedSubmission(null);
                setRejectionReason("");
              }
            }}
          >
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Тоолуурын илгээлтийн дэлгэрэнгүй</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Оршин суугч</Label>
                    <p className="font-medium">
                      {selectedSubmission.tenant?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Өрөө</Label>
                    <p className="font-medium">
                      {selectedSubmission.unit?.property?.name} -{" "}
                      {selectedSubmission.unit?.unit_number}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Төлбөрийн төрөл</Label>
                    <p className="font-medium">
                      {selectedSubmission.fee_type?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Илгээсэн утга</Label>
                    <p className="text-lg font-bold">
                      {selectedSubmission.submitted_reading.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Илгээсэн огноо</Label>
                    <p className="font-medium">
                      {new Date(selectedSubmission.submitted_at).toLocaleString(
                        "mn-MN"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Төлөв</Label>
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
                    <Label className="text-gray-500">Зураг</Label>
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      <img
                        src={selectedSubmission.photo_url}
                        alt="Тоолуурын зураг"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {selectedSubmission.notes && (
                  <div>
                    <Label className="text-gray-500">Тэмдэглэл</Label>
                    <p className="text-sm">{selectedSubmission.notes}</p>
                  </div>
                )}

                {selectedSubmission.status === "rejected" &&
                  selectedSubmission.rejection_reason && (
                    <div className="rounded-lg bg-red-50 p-3">
                      <Label className="text-red-700">Татгалзах шалтгаан</Label>
                      <p className="text-sm text-red-600">
                        {selectedSubmission.rejection_reason}
                      </p>
                    </div>
                  )}

                {selectedSubmission.status === "pending" && (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <Label htmlFor="rejectionReason">
                        Татгалзах шалтгаан (татгалзах үед)
                      </Label>
                      <Input
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Утга буруу, зураг тод биш гэх мэт"
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
                        {processing ? "Боловсруулж байна..." : "Татгалзах"}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(selectedSubmission)}
                        disabled={processing}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {processing ? "Боловсруулж байна..." : "Зөвшөөрөх"}
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
                    Хаах
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
