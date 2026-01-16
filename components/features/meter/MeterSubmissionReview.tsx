"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TenantMeterSubmission,
  FeeType,
  Unit,
  Tenant,
  MeterSubmissionStatus,
} from "@/types";
import {
  CheckCircle,
  XCircle,
  Clock,
  X,
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
    label: "Хүлээгдэж буй",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Зөвшөөрөгдсөн",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: { label: "Татгалзсан", color: "bg-red-100 text-red-800", icon: XCircle },
};

interface MeterSubmissionReviewProps {
  submission: SubmissionWithDetails;
  onApprove: (submission: SubmissionWithDetails) => Promise<void>;
  onReject: (
    submission: SubmissionWithDetails,
    reason: string
  ) => Promise<void>;
  onClose: () => void;
  processing?: boolean;
}

export function MeterSubmissionReview({
  submission,
  onApprove,
  onReject,
  onClose,
  processing = false,
}: MeterSubmissionReviewProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Татгалзах шалтгаанаа оруулна уу");
      return;
    }
    await onReject(submission, rejectionReason);
  };

  const statusInfo = statusConfig[submission.status];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Тоолуурын мэдээллийн дэлгэрэнгүй</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-500">Түрээслэгч</Label>
            <p className="font-medium">{submission.tenant?.name}</p>
          </div>
          <div>
            <Label className="text-gray-500">Өрөө</Label>
            <p className="font-medium">
              {submission.unit?.property?.name} - {submission.unit?.unit_number}
            </p>
          </div>
          <div>
            <Label className="text-gray-500">Төлбөрийн төрөл</Label>
            <p className="font-medium">{submission.fee_type?.name}</p>
          </div>
          <div>
            <Label className="text-gray-500">Илгээсэн утга</Label>
            <p className="text-lg font-bold">
              {submission.submitted_reading.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className="text-gray-500">Илгээсэн огноо</Label>
            <p className="font-medium">
              {new Date(submission.submitted_at).toLocaleString("mn-MN")}
            </p>
          </div>
          <div>
            <Label className="text-gray-500">Төлөв</Label>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
            >
              <statusInfo.icon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {submission.photo_url && (
          <div>
            <Label className="text-gray-500">Зураг</Label>
            <div className="mt-2 overflow-hidden rounded-lg border">
              <img
                src={submission.photo_url}
                alt="Тоолуурын зураг"
                className="h-48 w-full object-contain"
              />
            </div>
          </div>
        )}

        {submission.notes && (
          <div>
            <Label className="text-gray-500">Тэмдэглэл</Label>
            <p className="text-sm">{submission.notes}</p>
          </div>
        )}

        {submission.status === "rejected" && submission.rejection_reason && (
          <div className="rounded-lg bg-red-50 p-3">
            <Label className="text-red-700">Татгалзсан шалтгаан</Label>
            <p className="text-sm text-red-600">
              {submission.rejection_reason}
            </p>
          </div>
        )}

        {submission.status === "pending" && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="rejectionReason">Татгалзах шалтгаан (татгалзах бол)</Label>
              <Input
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Буруу тоо, бүдэг зураг гэх мэт"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReject}
                disabled={processing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Татгалзах
              </Button>
              <Button
                className="flex-1"
                onClick={() => onApprove(submission)}
                disabled={processing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Зөвшөөрөх
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
