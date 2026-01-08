"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Check } from "lucide-react";

type StaffSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  email: string;
  initialPassword: string;
};

export const StaffSuccessDialog = ({
  open,
  onOpenChange,
  staffName,
  email,
  initialPassword,
}: StaffSuccessDialogProps) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyToClipboard = async (text: string, type: "email" | "password") => {
    await navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle>Ажилтан амжилттай нэмэгдлээ</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            <strong>{staffName}</strong> ажилтан амжилттай бүртгэгдлээ.
            Доорх мэдээллийг ажилтандаа дамжуулна уу.
          </p>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase">Нэвтрэх имэйл</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border">
                  {email}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(email, "email")}
                >
                  {copiedEmail ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase">Анхны нууц үг</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border font-mono text-lg tracking-wider">
                  {initialPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(initialPassword, "password")}
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Энэ нууц үгийг аюулгүй хадгалах эсвэл ажилтандаа шууд дамжуулна уу.
              Ажилтан нэвтэрсний дараа нууц үгээ солих боломжтой.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Хаах</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
