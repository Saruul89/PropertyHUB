"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { NotificationSettings as NotificationSettingsType } from "@/types";

interface NotificationSettingsProps {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
}

export function NotificationSettings({
  emailEnabled = true,
  smsEnabled = true,
}: NotificationSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<NotificationSettingsType>>({
    email_billing_issued: true,
    email_payment_reminder: true,
    email_overdue_notice: true,
    email_payment_confirmed: true,
    email_lease_expiring: true,
    sms_payment_reminder: false,
    sms_overdue_notice: true,
    sms_account_created: true,
    sender_email: "",
    sender_name: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/notifications");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
      toast.error("Мэдэгдлийн тохиргоог авахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Мэдэгдлийн тохиргоог хадгаллаа");
      } else {
        const error = await res.json();
        toast.error(error.error || "Хадгалахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    key: keyof NotificationSettingsType,
    value: boolean | string
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Имэйл мэдэгдэл</CardTitle>
          </div>
          <CardDescription>Түрээслэгчид имэйл мэдэгдэл илгээх тохиргоо</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailEnabled && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Имэйл мэдэгдлийн функц одоогийн төлөвлөгөөнд байхгүй байна
            </div>
          )}

          <div
            className="space-y-4"
            style={{ opacity: emailEnabled ? 1 : 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Нэхэмжлэх үүсгэсэн мэдэгдэл</Label>
                <p className="text-sm text-muted-foreground">
                  Нэхэмжлэх үүсгэхэд түрээслэгчид мэдэгдэл илгээх
                </p>
              </div>
              <Switch
                checked={settings.email_billing_issued}
                onCheckedChange={(checked) =>
                  updateSetting("email_billing_issued", checked)
                }
                disabled={!emailEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Төлбөрийн сануулга</Label>
                <p className="text-sm text-muted-foreground">
                  Төлбөрийн хугацааны 3 хоногийн өмнө мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.email_payment_reminder}
                onCheckedChange={(checked) =>
                  updateSetting("email_payment_reminder", checked)
                }
                disabled={!emailEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Хугацаа хэтэрсэн мэдэгдэл</Label>
                <p className="text-sm text-muted-foreground">
                  Төлбөрийн хугацаа хэтэрсэн үед мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.email_overdue_notice}
                onCheckedChange={(checked) =>
                  updateSetting("email_overdue_notice", checked)
                }
                disabled={!emailEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Төлбөр баталгаажсан мэдэгдэл</Label>
                <p className="text-sm text-muted-foreground">
                  Төлбөр бүртгэл дуусахад мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.email_payment_confirmed}
                onCheckedChange={(checked) =>
                  updateSetting("email_payment_confirmed", checked)
                }
                disabled={!emailEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Гэрээний хугацааны сануулга</Label>
                <p className="text-sm text-muted-foreground">
                  Гэрээ дуусахаас 30 хоногийн өмнө мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.email_lease_expiring}
                onCheckedChange={(checked) =>
                  updateSetting("email_lease_expiring", checked)
                }
                disabled={!emailEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>SMS мэдэгдэл</CardTitle>
          </div>
          <CardDescription>
            Түрээслэгчид SMS мэдэгдэл илгээх тохиргоо (чухал мэдэгдэл)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!smsEnabled && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              SMS мэдэгдлийн функц одоогийн төлөвлөгөөнд байхгүй байна
            </div>
          )}

          <div className="space-y-4" style={{ opacity: smsEnabled ? 1 : 0.5 }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Төлбөрийн сануулга</Label>
                <p className="text-sm text-muted-foreground">
                  Төлбөрийн хугацааны 3 хоногийн өмнө SMS мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.sms_payment_reminder}
                onCheckedChange={(checked) =>
                  updateSetting("sms_payment_reminder", checked)
                }
                disabled={!smsEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Хугацаа хэтэрсэн мэдэгдэл</Label>
                <p className="text-sm text-muted-foreground">
                  Төлбөрийн хугацаа хэтэрсэн үед SMS мэдэгдэл
                </p>
              </div>
              <Switch
                checked={settings.sms_overdue_notice}
                onCheckedChange={(checked) =>
                  updateSetting("sms_overdue_notice", checked)
                }
                disabled={!smsEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Бүртгэл үүсгэсэн мэдэгдэл</Label>
                <p className="text-sm text-muted-foreground">
                  Түрээслэгч бүртгэхэд нэвтрэх мэдээллийг SMS-ээр илгээх
                </p>
              </div>
              <Switch
                checked={settings.sms_account_created}
                onCheckedChange={(checked) =>
                  updateSetting("sms_account_created", checked)
                }
                disabled={!smsEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Илгээгчийн тохиргоо</CardTitle>
          <CardDescription>Мэдэгдлийн имэйл илгээгчийн мэдээлэл</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender_email">Илгээгчийн имэйл хаяг</Label>
            <Input
              id="sender_email"
              type="email"
              placeholder="noreply@example.com"
              value={settings.sender_email || ""}
              onChange={(e) => updateSetting("sender_email", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Хоосон үед системийн үндсэн утгыг ашиглана
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">Илгээгчийн нэр</Label>
            <Input
              id="sender_name"
              placeholder="Удирдлагын компанийн нэр"
              value={settings.sender_name || ""}
              onChange={(e) => updateSetting("sender_name", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Имэйлийн "Илгээгч" хэсэгт харагдах нэр
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Хадгалах
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
