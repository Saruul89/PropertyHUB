"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks";
import { Save, Mail, MessageSquare, Bell, FileText, Loader2 } from "lucide-react";
import type { NotificationSettings } from "@/types";

type NotificationSettingsForm = Omit<NotificationSettings, "id" | "company_id" | "updated_at">;

const DEFAULT_BILLING_TEMPLATE = `{tenant_name} танд,

{month} сарын нэхэмжлэл үүслээ.
Дүн: {amount}₮
Хугацаа: {due_date}

{company_name}`;

const DEFAULT_REMINDER_TEMPLATE = `{tenant_name} танд,

{month} сарын төлбөрийн хугацаа ойртож байна.
Дүн: {amount}₮
Хугацаа: {due_date}

{company_name}`;

const TEMPLATE_VARIABLES = [
  { variable: "{tenant_name}", description: "Түрээслэгчийн нэр" },
  { variable: "{unit_number}", description: "Өрөөний дугаар" },
  { variable: "{property_name}", description: "Барилгын нэр" },
  { variable: "{month}", description: "Нэхэмжлэх сар" },
  { variable: "{amount}", description: "Төлбөрийн дүн" },
  { variable: "{due_date}", description: "Төлөх хугацаа" },
  { variable: "{company_name}", description: "Компанийн нэр" },
];

export default function NotificationSettingsPage() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsForm>({
    email_billing_issued: true,
    email_payment_reminder: true,
    email_overdue_notice: true,
    email_payment_confirmed: true,
    email_lease_expiring: true,
    sms_payment_reminder: false,
    sms_overdue_notice: false,
    sms_account_created: false,
    sender_email: "",
    sender_name: "",
    payment_reminder_days_before: 3,
    billing_issued_template: "",
    payment_reminder_template: "",
  });

  useEffect(() => {
    if (companyId) {
      fetchSettings();
    }
  }, [companyId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/notifications");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          email_billing_issued: data.email_billing_issued ?? true,
          email_payment_reminder: data.email_payment_reminder ?? true,
          email_overdue_notice: data.email_overdue_notice ?? true,
          email_payment_confirmed: data.email_payment_confirmed ?? true,
          email_lease_expiring: data.email_lease_expiring ?? true,
          sms_payment_reminder: data.sms_payment_reminder ?? false,
          sms_overdue_notice: data.sms_overdue_notice ?? false,
          sms_account_created: data.sms_account_created ?? false,
          sender_email: data.sender_email ?? "",
          sender_name: data.sender_name ?? "",
          payment_reminder_days_before: data.payment_reminder_days_before ?? 3,
          billing_issued_template: data.billing_issued_template ?? "",
          payment_reminder_template: data.payment_reminder_template ?? "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
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
        alert("Амжилттай хадгаллаа");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Хадгалахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettingsForm>(
    key: K,
    value: NotificationSettingsForm[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Мэдэгдлийн тохиргоо"
        showBack
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {/* Billing Issued Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Нэхэмжлэл илгээх мэдэгдэл
            </CardTitle>
            <CardDescription>
              Нэхэмжлэл үүсгэхэд түрээслэгчид имэйл мэдэгдэл илгээх
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_billing_issued">
                Нэхэмжлэл үүсгэхэд мэдэгдэл илгээх
              </Label>
              <Switch
                id="email_billing_issued"
                checked={settings.email_billing_issued}
                onCheckedChange={(checked) =>
                  updateSetting("email_billing_issued", checked)
                }
              />
            </div>

            {settings.email_billing_issued && (
              <div className="space-y-2">
                <Label htmlFor="billing_issued_template">
                  Загвар мессеж (заавал биш)
                </Label>
                <Textarea
                  id="billing_issued_template"
                  value={settings.billing_issued_template || ""}
                  onChange={(e) =>
                    updateSetting("billing_issued_template", e.target.value)
                  }
                  placeholder={DEFAULT_BILLING_TEMPLATE}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Хоосон үлдээвэл анхдагч загвар ашиглана
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Төлбөрийн сануулга
            </CardTitle>
            <CardDescription>
              Хугацаа дуусахаас өмнө автомат сануулга илгээх
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_payment_reminder">
                Төлбөрийн сануулга илгээх
              </Label>
              <Switch
                id="email_payment_reminder"
                checked={settings.email_payment_reminder}
                onCheckedChange={(checked) =>
                  updateSetting("email_payment_reminder", checked)
                }
              />
            </div>

            {settings.email_payment_reminder && (
              <>
                <div className="flex items-center gap-4">
                  <Label htmlFor="payment_reminder_days_before">
                    Илгээх өдөр:
                  </Label>
                  <span className="text-sm text-gray-600">
                    Хугацаа дуусахаас
                  </span>
                  <Input
                    id="payment_reminder_days_before"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.payment_reminder_days_before}
                    onChange={(e) =>
                      updateSetting(
                        "payment_reminder_days_before",
                        parseInt(e.target.value) || 3
                      )
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">хоногийн өмнө</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_reminder_template">
                    Загвар мессеж (заавал биш)
                  </Label>
                  <Textarea
                    id="payment_reminder_template"
                    value={settings.payment_reminder_template || ""}
                    onChange={(e) =>
                      updateSetting("payment_reminder_template", e.target.value)
                    }
                    placeholder={DEFAULT_REMINDER_TEMPLATE}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Хоосон үлдээвэл анхдагч загвар ашиглана
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Other Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Бусад мэдэгдлүүд</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_overdue_notice">
                  Хугацаа хэтэрсэн мэдэгдэл
                </Label>
                <p className="text-sm text-gray-500">
                  Төлбөрийн хугацаа хэтэрсэн үед мэдэгдэл илгээх
                </p>
              </div>
              <Switch
                id="email_overdue_notice"
                checked={settings.email_overdue_notice}
                onCheckedChange={(checked) =>
                  updateSetting("email_overdue_notice", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_payment_confirmed">
                  Төлбөр баталгаажсан мэдэгдэл
                </Label>
                <p className="text-sm text-gray-500">
                  Төлбөр хүлээн авсан үед мэдэгдэл илгээх
                </p>
              </div>
              <Switch
                id="email_payment_confirmed"
                checked={settings.email_payment_confirmed}
                onCheckedChange={(checked) =>
                  updateSetting("email_payment_confirmed", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_lease_expiring">
                  Гэрээ дуусах мэдэгдэл
                </Label>
                <p className="text-sm text-gray-500">
                  Гэрээний хугацаа дуусахад ойрхон үед мэдэгдэл илгээх
                </p>
              </div>
              <Switch
                id="email_lease_expiring"
                checked={settings.email_lease_expiring}
                onCheckedChange={(checked) =>
                  updateSetting("email_lease_expiring", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Мэдэгдлийн арга
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <Label>Имэйл</Label>
              </div>
              <Badge variant="secondary">Идэвхтэй</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <Label className="text-gray-400">SMS</Label>
              </div>
              <Badge variant="outline" className="text-gray-400">
                Удахгүй...
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Template Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Загвар хувьсагчууд</CardTitle>
            <CardDescription>
              Эдгээр хувьсагчуудыг загвар мессеж дотор ашиглаж болно
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {TEMPLATE_VARIABLES.map((item) => (
                <div
                  key={item.variable}
                  className="flex items-center gap-2 text-sm"
                >
                  <code className="rounded bg-gray-100 px-2 py-1 font-mono text-blue-600">
                    {item.variable}
                  </code>
                  <span className="text-gray-600">- {item.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
