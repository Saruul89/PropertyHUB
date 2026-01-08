"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useFeature } from "@/hooks";
import { FeeType, Property, Unit, MeterReading } from "@/types";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface UnitWithLastReading extends Unit {
  last_reading?: number;
  current_reading?: number;
}

interface MeterEntry {
  unit_id: string;
  unit_number: string;
  previous_reading: number;
  current_reading: string;
  isValid: boolean;
  error?: string;
}

export default function BulkMeterEntryPage() {
  const router = useRouter();
  const { companyId, user } = useAuth();
  const hasMeterReadings = useFeature("meter_readings");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [selectedFeeType, setSelectedFeeType] = useState<string>("");
  const [units, setUnits] = useState<UnitWithLastReading[]>([]);
  const [entries, setEntries] = useState<MeterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readingDate, setReadingDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    if (companyId) {
      fetchProperties();
      fetchFeeTypes();
    }
  }, [companyId]);

  useEffect(() => {
    if (selectedProperty && selectedFeeType) {
      fetchUnitsWithReadings();
    }
  }, [selectedProperty, selectedFeeType]);

  const fetchProperties = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (data) {
      setProperties(data);
      if (data.length === 1) {
        setSelectedProperty(data[0].id);
      }
    }
  };

  const fetchFeeTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("fee_types")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("calculation_type", "metered")
      .order("display_order");

    if (data) {
      setFeeTypes(data);
      if (data.length === 1) {
        setSelectedFeeType(data[0].id);
      }
    }
  };

  const fetchUnitsWithReadings = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get all occupied units for the property
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", selectedProperty)
      .eq("status", "occupied")
      .order("unit_number");

    if (!unitsData || unitsData.length === 0) {
      setUnits([]);
      setEntries([]);
      setLoading(false);
      return;
    }

    // Batch fetch: Get all last readings for the selected fee type in one query
    const unitIds = (unitsData as Unit[]).map((u) => u.id);
    const { data: allReadings } = await supabase
      .from("meter_readings")
      .select("unit_id, current_reading, reading_date")
      .in("unit_id", unitIds)
      .eq("fee_type_id", selectedFeeType)
      .order("reading_date", { ascending: false });

    // Create a map of unit_id to last reading (first occurrence per unit since ordered by date desc)
    const lastReadingMap = new Map<string, number>();
    (allReadings as MeterReading[] | null)?.forEach((reading) => {
      if (!lastReadingMap.has(reading.unit_id)) {
        lastReadingMap.set(reading.unit_id, reading.current_reading);
      }
    });

    // Combine units with their last readings
    const unitsWithReadings: UnitWithLastReading[] = (unitsData as Unit[]).map(
      (unit) => ({
        ...unit,
        last_reading: lastReadingMap.get(unit.id) ?? 0,
      })
    );

    setUnits(unitsWithReadings);
    setEntries(
      unitsWithReadings.map((unit) => ({
        unit_id: unit.id,
        unit_number: unit.unit_number,
        previous_reading: unit.last_reading ?? 0,
        current_reading: "",
        isValid: true,
      }))
    );
    setLoading(false);
  };

  const handleReadingChange = (index: number, value: string) => {
    const newEntries = [...entries];
    const entry = newEntries[index];
    entry.current_reading = value;

    // Validate
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue < entry.previous_reading)) {
      entry.isValid = false;
      entry.error =
        numValue < entry.previous_reading
          ? "Өмнөх утгаас бага байж болохгүй"
          : "Зөв утга оруулна уу";
    } else {
      entry.isValid = true;
      entry.error = undefined;
    }

    setEntries(newEntries);
  };

  const getConsumption = (entry: MeterEntry) => {
    const current = parseFloat(entry.current_reading);
    if (isNaN(current)) return 0;
    return current - entry.previous_reading;
  };

  const getAmount = (entry: MeterEntry) => {
    const feeType = feeTypes.find((f) => f.id === selectedFeeType);
    if (!feeType) return 0;
    return getConsumption(entry) * (feeType.default_unit_price ?? 0);
  };

  const handleSave = async () => {
    const validEntries = entries.filter(
      (e) =>
        e.current_reading &&
        e.isValid &&
        parseFloat(e.current_reading) > e.previous_reading
    );

    if (validEntries.length === 0) {
      alert("Хадгалах тоолуурын бүртгэл байхгүй байна");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const feeType = feeTypes.find((f) => f.id === selectedFeeType);

    const readings = validEntries.map((entry) => ({
      unit_id: entry.unit_id,
      fee_type_id: selectedFeeType,
      reading_date: readingDate,
      previous_reading: entry.previous_reading,
      current_reading: parseFloat(entry.current_reading),
      unit_price: feeType?.default_unit_price ?? 0,
      recorded_by: user?.id,
    }));

    const { error } = await supabase.from("meter_readings").insert(readings);

    setSaving(false);

    if (error) {
      alert("Хадгалахад алдаа гарлаа: " + error.message);
    } else {
      router.push("/dashboard/meter-readings");
    }
  };

  const filledCount = entries.filter(
    (e) =>
      e.current_reading &&
      e.isValid &&
      parseFloat(e.current_reading) > e.previous_reading
  ).length;

  const totalConsumption = entries.reduce(
    (sum, e) => sum + getConsumption(e),
    0
  );
  const totalAmount = entries.reduce((sum, e) => sum + getAmount(e), 0);

  if (!hasMeterReadings) {
    return (
      <>
        <Header title="Тоолуурын бүртгэл" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Save className="mb-4 h-12 w-12 text-gray-400" />
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
      <Header title="Тоолуурын бүртгэл" showBack />
      <div className="p-6">
        {/* Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Оруулах нөхцөл сонгох</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="property">Хөрөнгө</Label>
                <select
                  id="property"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Хөрөнгө сонгох</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="feeType">Төлбөрийн төрөл</Label>
                <select
                  id="feeType"
                  value={selectedFeeType}
                  onChange={(e) => setSelectedFeeType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Төлбөрийн төрөл сонгох</option>
                  {feeTypes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}（Нэгжийн үнэ: ₮{f.default_unit_price?.toLocaleString()}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="readingDate">Бүртгэлийн огноо</Label>
                <Input
                  id="readingDate"
                  type="date"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meter Entry Form */}
        {loading ? (
          <div className="text-center text-gray-500">Ачааллаж байна...</div>
        ) : !selectedProperty || !selectedFeeType ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Хөрөнгө болон төлбөрийн төрлийг сонгоно уу
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Түрээслэгчтэй өрөө байхгүй байна
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Оруулсан: <strong>{filledCount}</strong> / {entries.length}
                </span>
                <span>
                  Нийт хэрэглээ: <strong>{totalConsumption.toLocaleString()}</strong>
                </span>
                <span>
                  Нийт дүн: <strong>₮{totalAmount.toLocaleString()}</strong>
                </span>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || filledCount === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Хадгалж байна..." : `${filledCount} бүртгэл хадгалах`}
              </Button>
            </div>

            {/* Entry Table */}
            <div className="overflow-hidden rounded-lg border bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      өрөөний дугаар
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Өмнөх заалт
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                      Одоогийн заалт
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Хэрэглээ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Дүн
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry, index) => {
                    const consumption = getConsumption(entry);
                    const amount = getAmount(entry);
                    const isFilled =
                      entry.current_reading && entry.isValid && consumption > 0;

                    return (
                      <tr
                        key={entry.unit_id}
                        className={
                          !entry.isValid
                            ? "bg-red-50"
                            : isFilled
                            ? "bg-green-50"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          {entry.unit_number}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">
                          {entry.previous_reading.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={entry.current_reading}
                            onChange={(e) =>
                              handleReadingChange(index, e.target.value)
                            }
                            placeholder={entry.previous_reading.toString()}
                            className={`text-right font-mono ${
                              !entry.isValid
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                          />
                          {entry.error && (
                            <p className="mt-1 text-xs text-red-500">
                              {entry.error}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {consumption > 0 ? (
                            <span className="text-blue-600">
                              {consumption.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {amount > 0 ? (
                            <span>₮{amount.toLocaleString()}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!entry.isValid ? (
                            <AlertCircle className="mx-auto h-5 w-5 text-red-500" />
                          ) : isFilled ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
