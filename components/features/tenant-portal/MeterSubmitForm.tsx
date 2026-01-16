"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeType, TenantMeterSubmission } from "@/types";
import { Gauge, Send, CheckCircle, AlertCircle, Camera } from "lucide-react";

interface MeterTypeWithReading extends FeeType {
  lastReading?: number;
  pendingSubmission?: TenantMeterSubmission;
}

interface MeterSubmitFormProps {
  meterType: MeterTypeWithReading;
  onSubmit: (data: { reading: number; notes?: string }) => Promise<void>;
  onCancel: () => void;
}

export function MeterSubmitForm({
  meterType,
  onSubmit,
  onCancel,
}: MeterSubmitFormProps) {
  const [readingValue, setReadingValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!readingValue) {
      setError("Тоолуурын утгыг оруулна уу");
      return;
    }

    const value = parseFloat(readingValue);
    if (isNaN(value)) {
      setError("Хүчинтэй тоо оруулна уу");
      return;
    }

    if (value < (meterType.lastReading ?? 0)) {
      setError("Өмнөх утгаас бага утга оруулах боломжгүй");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit({
        reading: value,
        notes: notes || undefined,
      });
      setSuccess(true);
      setReadingValue("");
      setNotes("");
      setTimeout(() => {
        onCancel();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError("Илгээхэд алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          {meterType.name} тоолуурын утга илгээх
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center py-8 text-green-600">
            <CheckCircle className="mb-2 h-12 w-12" />
            <p className="font-medium">Амжилттай илгээгдлээ</p>
            <p className="text-sm text-gray-500">
              Удирдлагын компани шалгаж зөвшөөрнө
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Өмнөх утга:{" "}
                <span className="text-lg font-bold">
                  {(meterType.lastReading ?? 0).toLocaleString()}
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="reading">Одоогийн тоолуурын утга</Label>
              <Input
                id="reading"
                type="number"
                value={readingValue}
                onChange={(e) => {
                  setReadingValue(e.target.value);
                  setError("");
                }}
                placeholder={(meterType.lastReading ?? 0).toString()}
                className="mt-1 text-lg"
              />
              {error && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Тэмдэглэл (заавал биш)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Тэмдэглэл үлдээх боломжтой"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Цуцлах
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || !readingValue}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Илгээж байна..." : "Илгээх"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
