"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Receipt, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

interface LeaseWithDetails extends Lease {
  tenant?: Tenant;
  unit?: Unit & { property?: Property };
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

interface BillingGenerateProps {
  onComplete?: (count: number) => void;
}

export function BillingGenerate({ onComplete }: BillingGenerateProps) {
  const router = useRouter();
  const { companyId } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  // Step 1: Select billing month
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [issueDate, setIssueDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date();
    now.setDate(15);
    return now.toISOString().split("T")[0];
  });

  // Step 2: Select leases
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

    // Fetch active leases
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
        leasesData.map((l: Record<string, unknown>) => ({
          ...l,
          tenant: l.tenants as Tenant | undefined,
          unit: l.units
            ? {
                ...(l.units as Unit),
                property: (l.units as Record<string, unknown>).properties as
                  | Property
                  | undefined,
              }
            : undefined,
        })) as LeaseWithDetails[]
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

    const selectedLeases = leases.filter((l) =>
      selectedLeaseIds.includes(l.id)
    );
    const unitIds = selectedLeases
      .map((l) => l.unit_id)
      .filter(Boolean) as string[];

    // Batch fetch unit fees
    const { data: allUnitFees } = await supabase
      .from("unit_fees")
      .select("*, fee_types(*)")
      .in("unit_id", unitIds)
      .eq("is_active", true);

    // Batch fetch meter readings
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

    // Group by unit_id
    type UnitFeeWithType = UnitFee & { fee_types: FeeType };
    const unitFeesMap = new Map<string, UnitFeeWithType[]>();
    (allUnitFees as UnitFeeWithType[] | null)?.forEach((uf) => {
      const existing = unitFeesMap.get(uf.unit_id) || [];
      existing.push(uf);
      unitFeesMap.set(uf.unit_id, existing);
    });

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
        fee_name: "賃料",
        description: `${billingMonth}月分`,
        quantity: 1,
        unit_price: lease.monthly_rent,
        amount: lease.monthly_rent,
      });

      // Process unit-specific fees
      const unitFees = unitFeesMap.get(lease.unit_id) || [];
      const addedFeeTypeIds = new Set<string>();

      for (const unitFee of unitFees) {
        const feeType = unitFee.fee_types;
        if (!feeType) continue;

        addedFeeTypeIds.add(feeType.id);

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
                description: `使用量: ${meterReading.consumption.toLocaleString()} (${
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

      // Add default fee types
      for (const feeType of feeTypes) {
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
            unitPrice = feeType.default_unit_price;
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
                description: `使用量: ${meterReading.consumption.toLocaleString()} (${
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
    setSubmitting(true);
    const supabase = createClient();
    let count = 0;

    for (const [leaseId, data] of previewData) {
      const billingNumber = `INV-${billingMonth.replace("-", "")}-${String(
        count + 1
      ).padStart(4, "0")}`;

      const { data: billing, error: billingError } = await supabase
        .from("billings")
        .insert({
          lease_id: leaseId,
          tenant_id: data.lease.tenant_id,
          unit_id: data.lease.unit_id,
          company_id: companyId,
          billing_number: billingNumber,
          billing_month: `${billingMonth}-01`,
          issue_date: issueDate,
          due_date: dueDate,
          subtotal: data.total,
          tax_amount: 0,
          total_amount: data.total,
          status: "pending",
          paid_amount: 0,
        })
        .select()
        .single();

      if (billingError || !billing) continue;

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

      count++;
    }

    setGeneratedCount(count);
    setSuccess(true);
    setSubmitting(false);
    onComplete?.(count);
  };

  if (success) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-xl font-semibold">請求書生成完了</h2>
            <p className="mb-6 text-gray-600">
              {generatedCount}件の請求書が生成されました
            </p>
            <Button onClick={() => router.push("/dashboard/billings")}>
              請求一覧へ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
              {s === 1 && "請求月を選択"}
              {s === 2 && "対象者を選択"}
              {s === 3 && "確認・生成"}
            </span>
            {s < 3 && <div className="mx-2 h-px w-8 bg-gray-300" />}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Ачааллаж байна...</div>
      ) : (
        <>
          {/* Step 1 */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>請求月を選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="billingMonth">請求月</Label>
                  <Input
                    id="billingMonth"
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">発行日</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">支払期限</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)}>
                    次へ <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>対象者を選択</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedLeaseIds.length === leases.length
                      ? "選択解除"
                      : "すべて選択"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leases.length === 0 ? (
                  <p className="text-center text-gray-500">
                    アクティブな契約がありません
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
                            <p className="font-medium">{lease.tenant?.name}</p>
                            <p className="text-sm text-gray-500">
                              {lease.unit?.property?.name} -{" "}
                              {lease.unit?.unit_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₮{lease.monthly_rent.toLocaleString()}/月
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> 戻る
                  </Button>
                  <Button
                    onClick={() => {
                      generatePreview();
                      setStep(3);
                    }}
                    disabled={selectedLeaseIds.length === 0}
                  >
                    次へ ({selectedLeaseIds.length}件選択)
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>請求プレビュー</CardTitle>
                  <p className="text-sm text-gray-500">
                    {billingMonth}月分 / 支払期限:{" "}
                    {new Date(dueDate).toLocaleDateString("ja-JP")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(previewData.values()).map(
                      ({ lease, items, total }) => (
                        <div key={lease.id} className="rounded-lg border p-4">
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
                      <span>合計 ({previewData.size}件)</span>
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> 戻る
                </Button>
                <Button onClick={handleGenerateBillings} disabled={submitting}>
                  <Receipt className="mr-2 h-4 w-4" />
                  {submitting ? "生成中..." : "請求書を生成"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
