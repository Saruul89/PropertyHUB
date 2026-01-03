"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { FeeType, Unit } from "@/types";
import { X, Save, AlertCircle } from "lucide-react";

interface MeterReadingFormProps {
  unit: Unit;
  feeType: FeeType;
  previousReading: number;
  onSubmit: (data: {
    current_reading: number;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MeterReadingForm({
  unit,
  feeType,
  previousReading,
  onSubmit,
  onCancel,
}: MeterReadingFormProps) {
  const [currentReading, setCurrentReading] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const consumption = parseFloat(currentReading) - previousReading;
  const isValidConsumption = !isNaN(consumption) && consumption >= 0;
  const totalAmount = isValidConsumption
    ? consumption * (feeType.default_unit_price ?? 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const value = parseFloat(currentReading);
    if (isNaN(value)) {
      setError("有効な数値を入力してください");
      return;
    }

    if (value < previousReading) {
      setError("前回の数値より小さい値は入力できません");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        current_reading: value,
        notes: notes || undefined,
      });
    } catch (err) {
      setError("Хадгалахに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {unit.unit_number} - {feeType.name}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              前回値:{" "}
              <span className="font-bold">
                {previousReading.toLocaleString()}
              </span>
            </p>
          </div>

          <div>
            <Label htmlFor="current_reading">今回の値</Label>
            <Input
              id="current_reading"
              type="number"
              step="0.001"
              value={currentReading}
              onChange={(e) => {
                setCurrentReading(e.target.value);
                setError("");
              }}
              placeholder={previousReading.toString()}
              className="mt-1"
            />
            {error && (
              <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          {isValidConsumption && consumption > 0 && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-3">
              <div>
                <p className="text-sm text-gray-600">使用量</p>
                <p className="text-lg font-bold text-blue-600">
                  {consumption.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">金額</p>
                <p className="text-lg font-bold">
                  ₮{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">メモ（任意）</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Тэмдэглэлがあれば入力"
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Цуцлах
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting || !currentReading}
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? "Хадгалах中..." : "Хадгалах"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
