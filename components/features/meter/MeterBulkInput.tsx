"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Unit, FeeType, Property } from "@/types";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface MeterEntry {
  unit_id: string;
  unit_number: string;
  previous_reading: number;
  current_reading: string;
  isValid: boolean;
  error?: string;
}

interface MeterBulkInputProps {
  units: (Unit & { last_reading?: number })[];
  feeType: FeeType;
  readingDate: string;
  onSave: (
    readings: { unit_id: string; current_reading: number }[]
  ) => Promise<void>;
  onDateChange: (date: string) => void;
}

export function MeterBulkInput({
  units,
  feeType,
  readingDate,
  onSave,
  onDateChange,
}: MeterBulkInputProps) {
  const [entries, setEntries] = useState<MeterEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEntries(
      units.map((unit) => ({
        unit_id: unit.id,
        unit_number: unit.unit_number,
        previous_reading: unit.last_reading ?? 0,
        current_reading: "",
        isValid: true,
      }))
    );
  }, [units]);

  const handleReadingChange = useCallback((index: number, value: string) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      const entry = { ...newEntries[index] };
      entry.current_reading = value;

      const numValue = parseFloat(value);
      if (value && (isNaN(numValue) || numValue < entry.previous_reading)) {
        entry.isValid = false;
        entry.error =
          numValue < entry.previous_reading ? "前回より小さい" : "無効な数値";
      } else {
        entry.isValid = true;
        entry.error = undefined;
      }

      newEntries[index] = entry;
      return newEntries;
    });
  }, []);

  const getConsumption = (entry: MeterEntry) => {
    const current = parseFloat(entry.current_reading);
    if (isNaN(current)) return 0;
    return current - entry.previous_reading;
  };

  const getAmount = (entry: MeterEntry) => {
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
      alert("Хадгалахするメーター記録がありません");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        validEntries.map((e) => ({
          unit_id: e.unit_id,
          current_reading: parseFloat(e.current_reading),
        }))
      );
    } finally {
      setSaving(false);
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

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Эзэмшигчтэйの部屋がありません
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            入力済み: <strong>{filledCount}</strong> / {entries.length}
          </span>
          <span>
            総使用量: <strong>{totalConsumption.toLocaleString()}</strong>
          </span>
          <span>
            総金額: <strong>₮{totalAmount.toLocaleString()}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={readingDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleSave} disabled={saving || filledCount === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Хадгалах中..." : `${filledCount}件をХадгалах`}
          </Button>
        </div>
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
                前回読み
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                今回読み
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                使用量
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                金額
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                状態
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
                    !entry.isValid ? "bg-red-50" : isFilled ? "bg-green-50" : ""
                  }
                >
                  <td className="px-4 py-3 font-medium">{entry.unit_number}</td>
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
                      <p className="mt-1 text-xs text-red-500">{entry.error}</p>
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
                    {amount > 0 ? <span>₮{amount.toLocaleString()}</span> : "-"}
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
    </div>
  );
}
