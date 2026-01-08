"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import {
  Property,
  Unit,
  Tenant,
  Lease,
  FeeType,
  UnitFee,
  MeterReading,
} from "@/types";
import { Receipt, CheckCircle } from "lucide-react";

interface LeaseWithDetails extends Lease {
  tenant?: Tenant;
  unit?: Unit & { property?: Property };
}

interface LeaseFromSupabase extends Omit<Lease, "end_date"> {
  end_date: string | null;
  tenants: Tenant | null;
  units: (Unit & { properties: Property | null }) | null;
}

interface BillingItemPreview {
  fee_type_id?: string;
  fee_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  meter_reading_id?: string;
}

export default function GenerateBillingPage() {
  const router = useRouter();
  const { companyId } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [emailSentCount, setEmailSentCount] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);

  // 開発用: 重複通知チェックをスキップ
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  // Step 1: Select billing month
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date();
    now.setDate(15);
    return now.toISOString().split("T")[0];
  });

  // Step 2: Select tenants/leases
  const [leases, setLeases] = useState<LeaseWithDetails[]>([]);
  const [selectedLeaseIds, setSelectedLeaseIds] = useState<string[]>([]);

  // Step 3: Fee types
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);

  // Step 4: Preview
  const [previewData, setPreviewData] = useState<
    Map<
      string,
      { lease: LeaseWithDetails; items: BillingItemPreview[]; total: number }
    >
  >(new Map());

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch active leases with tenant and unit info
    const { data: leasesData } = await supabase
      .from("leases")
      .select(
        `
                *,
                tenants(*),
                units(*, properties(*))
            `
      )
      .eq("company_id", companyId)
      .eq("status", "active");

    if (leasesData) {
      setLeases(
        (leasesData as LeaseFromSupabase[]).map((l) => {
          const { tenants, units, ...leaseData } = l;
          return {
            ...leaseData,
            end_date: leaseData.end_date ?? undefined,
            tenant: tenants ?? undefined,
            unit: units
              ? {
                  ...units,
                  property: units.properties ?? undefined,
                }
              : undefined,
          };
        })
      );
    }

    // Fetch fee types
    const { data: feeTypesData } = await supabase
      .from("fee_types")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("display_order");

    if (feeTypesData) {
      setFeeTypes(feeTypesData);
    }

    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedLeaseIds.length === leases.length) {
      setSelectedLeaseIds([]);
    } else {
      setSelectedLeaseIds(leases.map((l) => l.id));
    }
  };

  const handleSelectLease = (leaseId: string) => {
    setSelectedLeaseIds((prev) =>
      prev.includes(leaseId)
        ? prev.filter((id) => id !== leaseId)
        : [...prev, leaseId]
    );
  };

  const generatePreview = async () => {
    const supabase = createClient();
    const newPreviewData = new Map<
      string,
      { lease: LeaseWithDetails; items: BillingItemPreview[]; total: number }
    >();

    // Get selected leases
    const selectedLeases = leases.filter((l) =>
      selectedLeaseIds.includes(l.id)
    );
    const unitIds = selectedLeases
      .map((l) => l.unit_id)
      .filter(Boolean) as string[];

    // Batch fetch: Get all unit fees for selected units in one query
    const { data: allUnitFees } = await supabase
      .from("unit_fees")
      .select("*, fee_types(*)")
      .in("unit_id", unitIds)
      .eq("is_active", true);

    // Batch fetch: Get all meter readings for selected units in date range
    const startDate = `${billingMonth}-01`;
    const endDate = new Date(billingMonth + "-01");
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data: allMeterReadings } = await supabase
      .from("meter_readings")
      .select("*")
      .in("unit_id", unitIds)
      .gte("reading_date", startDate)
      .lt("reading_date", endDateStr)
      .order("reading_date", { ascending: false });

    // Group data by unit_id for efficient lookup
    type UnitFeeWithType = UnitFee & { fee_types: FeeType };
    const unitFeesMap = new Map<string, UnitFeeWithType[]>();
    (allUnitFees as UnitFeeWithType[] | null)?.forEach((uf) => {
      const existing = unitFeesMap.get(uf.unit_id) || [];
      existing.push(uf);
      unitFeesMap.set(uf.unit_id, existing);
    });

    // Group meter readings by unit_id and fee_type_id (take latest for each combination)
    const meterReadingsMap = new Map<string, MeterReading>();
    (allMeterReadings as MeterReading[] | null)?.forEach((mr) => {
      const key = `${mr.unit_id}-${mr.fee_type_id}`;
      if (!meterReadingsMap.has(key)) {
        meterReadingsMap.set(key, mr);
      }
    });

    for (const lease of selectedLeases) {
      if (!lease.unit) continue;

      const items: BillingItemPreview[] = [];

      // Add monthly rent
      items.push({
        fee_name: "Түрээсийн төлбөр",
        description: `${billingMonth} сарын`,
        quantity: 1,
        unit_price: lease.monthly_rent,
        amount: lease.monthly_rent,
      });

      // Process unit-specific fees from batch data
      const unitFees = unitFeesMap.get(lease.unit_id) || [];
      for (const unitFee of unitFees) {
        const feeType = unitFee.fee_types as FeeType;
        if (!feeType) continue;

        let amount = 0;
        let quantity = 1;
        let unitPrice = 0;

        switch (feeType.calculation_type) {
          case "fixed":
            unitPrice = unitFee.custom_amount ?? feeType.default_amount;
            amount = unitPrice;
            break;
          case "per_sqm":
            unitPrice =
              unitFee.custom_unit_price ?? feeType.default_unit_price ?? 0;
            quantity = lease.unit?.area_sqm ?? 0;
            amount = unitPrice * quantity;
            break;
          case "metered": {
            const meterReading = meterReadingsMap.get(
              `${lease.unit_id}-${feeType.id}`
            );
            if (meterReading) {
              items.push({
                fee_type_id: feeType.id,
                fee_name: feeType.name,
                description: `Хэрэглээ: ${meterReading.consumption.toLocaleString()} (${
                  meterReading.previous_reading
                } → ${meterReading.current_reading})`,
                quantity: meterReading.consumption,
                unit_price: meterReading.unit_price,
                amount: meterReading.total_amount,
                meter_reading_id: meterReading.id,
              });
            }
            continue;
          }
          case "custom":
            unitPrice = unitFee.custom_amount ?? 0;
            amount = unitPrice;
            break;
        }

        if (amount > 0) {
          items.push({
            fee_type_id: feeType.id,
            fee_name: feeType.name,
            quantity,
            unit_price: unitPrice,
            amount,
          });
        }
      }

      // Add default fee types (not unit-specific)
      const unitFeeTypeIds = new Set(
        unitFees?.map((uf: UnitFee) => uf.fee_type_id) || []
      );
      const addedFeeTypeIds = new Set(
        items.filter((i) => i.fee_type_id).map((i) => i.fee_type_id)
      );

      for (const feeType of feeTypes) {
        if (unitFeeTypeIds.has(feeType.id)) continue;
        if (addedFeeTypeIds.has(feeType.id)) continue;

        let amount = 0;
        let quantity = 1;
        let unitPrice = 0;

        switch (feeType.calculation_type) {
          case "fixed":
            if (feeType.default_amount === 0) continue;
            unitPrice = feeType.default_amount;
            amount = unitPrice;
            break;
          case "per_sqm":
            if (!feeType.default_unit_price) continue;
            unitPrice = feeType.default_unit_price ?? 0;
            quantity = lease.unit?.area_sqm ?? 0;
            amount = unitPrice * quantity;
            break;
          case "metered": {
            const meterReading = meterReadingsMap.get(
              `${lease.unit_id}-${feeType.id}`
            );
            if (meterReading) {
              items.push({
                fee_type_id: feeType.id,
                fee_name: feeType.name,
                description: `Хэрэглээ: ${meterReading.consumption.toLocaleString()} (${
                  meterReading.previous_reading
                } → ${meterReading.current_reading})`,
                quantity: meterReading.consumption,
                unit_price: meterReading.unit_price,
                amount: meterReading.total_amount,
                meter_reading_id: meterReading.id,
              });
            }
            continue;
          }
          case "custom":
            continue;
        }

        if (amount > 0) {
          items.push({
            fee_type_id: feeType.id,
            fee_name: feeType.name,
            quantity,
            unit_price: unitPrice,
            amount,
          });
        }
      }

      const total = items.reduce((sum, item) => sum + item.amount, 0);
      newPreviewData.set(lease.id, { lease, items, total });
    }

    setPreviewData(newPreviewData);
  };

  const handleGenerateBillings = async () => {
    console.log("[Billing] handleGenerateBillings started");
    console.log("[Billing] previewData size:", previewData.size);

    setSubmitting(true);
    const supabase = createClient();
    let count = 0;
    const createdBillingIds: string[] = [];

    // Get the latest billing number for this month to avoid duplicates
    const monthPrefix = `INV-${billingMonth.replace("-", "")}-`;
    const { data: latestBilling } = await supabase
      .from("billings")
      .select("billing_number")
      .eq("company_id", companyId)
      .like("billing_number", `${monthPrefix}%`)
      .order("billing_number", { ascending: false })
      .limit(1)
      .single();

    let startNumber = 1;
    if (latestBilling?.billing_number) {
      const lastNumber = parseInt(
        latestBilling.billing_number.replace(monthPrefix, ""),
        10
      );
      if (!isNaN(lastNumber)) {
        startNumber = lastNumber + 1;
      }
    }

    for (const [leaseId, data] of previewData) {
      // Generate billing number with unique sequence
      const billingNumber = `${monthPrefix}${String(startNumber + count).padStart(4, "0")}`;

      // Create billing
      const { data: billing, error: billingError } = await supabase
        .from("billings")
        .insert({
          lease_id: leaseId,
          tenant_id: data.lease.tenant_id,
          unit_id: data.lease.unit_id,
          company_id: companyId,
          billing_number: billingNumber,
          billing_month: `${billingMonth}-01`,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: dueDate,
          subtotal: data.total,
          tax_amount: 0,
          total_amount: data.total,
          status: "pending",
          paid_amount: 0,
        })
        .select()
        .single();

      if (billingError || !billing) {
        console.error("[Billing] Failed to create billing:", billingError);
        continue;
      }
      console.log("[Billing] Created billing:", billing.id);

      // Create billing items
      for (const item of data.items) {
        await supabase.from("billing_items").insert({
          billing_id: billing.id,
          fee_type_id: item.fee_type_id || null,
          fee_name: item.fee_name,
          description: item.description || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          meter_reading_id: item.meter_reading_id || null,
        });
      }

      createdBillingIds.push(billing.id);
      count++;
    }

    console.log("[Billing] Total created billings:", createdBillingIds.length);

    // Send billing issued notifications
    if (createdBillingIds.length > 0) {
      try {
        console.log("[Notification] Sending billing issued notifications...");
        console.log("[Notification] Billing IDs:", createdBillingIds);
        console.log("[Notification] Tenant count:", previewData.size);

        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "billing_issued",
            channels: ["email"],
            recipient_ids: Array.from(previewData.values()).map(
              (d) => d.lease.tenant_id
            ),
            template_data: {
              billing_month: billingMonth,
              due_date: dueDate,
            },
            skip_duplicate_check: skipDuplicateCheck,
          }),
        });

        const result = await response.json();
        console.log("[Notification] Response:", result);

        if (result.success) {
          setEmailSentCount(result.queued || 0);
          console.log(`[Notification] Successfully queued ${result.queued} emails`);

          // 開発環境: キューを即座に処理
          if (result.queued > 0 && process.env.NODE_ENV === "development") {
            console.log("[Notification] Processing queue immediately (dev mode)...");
            try {
              const processResponse = await fetch("/api/notifications/process-now", {
                method: "POST",
              });
              const processResult = await processResponse.json();
              console.log("[Notification] Queue processed:", processResult);
            } catch (processError) {
              console.error("[Notification] Failed to process queue:", processError);
            }
          }
        } else {
          setEmailError(result.error || "Unknown error");
          console.error("[Notification] Failed:", result.error);
        }
      } catch (error) {
        console.error("[Notification] Failed to send billing notifications:", error);
        setEmailError(error instanceof Error ? error.message : "Network error");
      }
    }

    setGeneratedCount(count);
    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <>
        <Header title="Нэхэмжлэл үүсгэх" showBack />
        <div className="p-6">
          <Card className="mx-auto max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h2 className="mb-2 text-xl font-semibold">
                  Нэхэмжлэл амжилттай үүслээ
                </h2>
                <p className="mb-2 text-gray-600">
                  {generatedCount} нэхэмжлэл үүсгэгдлээ
                </p>
                {emailSentCount > 0 && (
                  <p className="mb-2 text-sm text-green-600">
                    {emailSentCount} түрээслэгчид имэйл мэдэгдэл илгээгдлээ
                  </p>
                )}
                {emailError && (
                  <p className="mb-2 text-sm text-red-600">
                    Имэйл илгээхэд алдаа: {emailError}
                  </p>
                )}
                <Button onClick={() => router.push("/dashboard/billings")} className="mt-4">
                  Нэхэмжлэлийн жагсаалт руу
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Нэхэмжлэл үүсгэх" showBack />
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          {/* Steps indicator */}
          <div className="mb-8 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === s
                      ? "bg-blue-600 text-white"
                      : step > s
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                <span className={step === s ? "font-medium" : "text-gray-500"}>
                  {s === 1 && "Нэхэмжлэх сар сонгох"}
                  {s === 2 && "Түрээслэгч сонгох"}
                  {s === 3 && "Баталгаажуулах"}
                </span>
                {s < 3 && <div className="mx-2 h-px w-8 bg-gray-300" />}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Ачааллаж байна...</div>
          ) : (
            <>
              {/* Step 1: Select billing month */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Нэхэмжлэх сар сонгох</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="billingMonth">Нэхэмжлэх сар</Label>
                      <Input
                        id="billingMonth"
                        type="month"
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Төлөх хугацаа</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setStep(2)}>Дараах</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Select tenants */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Түрээслэгч сонгох</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedLeaseIds.length === leases.length
                          ? "Сонголтыг цуцлах"
                          : "Бүгдийг сонгох"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {leases.length === 0 ? (
                      <p className="text-center text-gray-500">
                        Идэвхтэй гэрээ байхгүй байна
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {leases.map((lease) => (
                          <div
                            key={lease.id}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                              selectedLeaseIds.includes(lease.id)
                                ? "border-blue-500 bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleSelectLease(lease.id)}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={selectedLeaseIds.includes(lease.id)}
                                onChange={() => handleSelectLease(lease.id)}
                                className="h-4 w-4"
                              />
                              <div>
                                <p className="font-medium">
                                  {lease.tenant?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {lease.unit?.property?.name} -{" "}
                                  {lease.unit?.unit_number}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ₮{lease.monthly_rent.toLocaleString()}/сар
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Буцах
                      </Button>
                      <Button
                        onClick={() => {
                          generatePreview();
                          setStep(3);
                        }}
                        disabled={selectedLeaseIds.length === 0}
                      >
                        Дараах ({selectedLeaseIds.length} сонгосон)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Preview and Generate */}
              {step === 3 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Нэхэмжлэлийн урьдчилсан харагдац</CardTitle>
                      <p className="text-sm text-gray-500">
                        {billingMonth} сар / Төлөх хугацаа:{" "}
                        {new Date(dueDate).toLocaleDateString("mn-MN")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Array.from(previewData.values()).map(
                          ({ lease, items, total }) => (
                            <div
                              key={lease.id}
                              className="rounded-lg border p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {lease.tenant?.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {lease.unit?.property?.name} -{" "}
                                    {lease.unit?.unit_number}
                                  </p>
                                </div>
                                <p className="text-lg font-bold">
                                  ₮{total.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1 border-t pt-2 text-sm">
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-gray-600"
                                  >
                                    <span>{item.fee_name}</span>
                                    <span>₮{item.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-6 rounded-lg bg-gray-50 p-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Нийт ({previewData.size})</span>
                          <span>
                            ₮
                            {Array.from(previewData.values())
                              .reduce((sum, d) => sum + d.total, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 開発用: 重複チェックスキップ */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={skipDuplicateCheck}
                          onChange={(e) => setSkipDuplicateCheck(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-yellow-800">
                          [DEV] 重複通知チェックをスキップ（24時間以内に同じ通知を送信済みでも再送信）
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Буцах
                    </Button>
                    <Button
                      onClick={handleGenerateBillings}
                      disabled={submitting}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      {submitting ? "Үүсгэж байна..." : "Нэхэмжлэл үүсгэх"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
