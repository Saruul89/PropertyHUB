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
      toast.error("通知設定の取得に失敗しました");
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
        toast.success("通知設定をХадгалахしました");
      } else {
        const error = await res.json();
        toast.error(error.error || "Хадгалахに失敗しました");
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      toast.error("Хадгалахに失敗しました");
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
            <CardTitle>メール通知</CardTitle>
          </div>
          <CardDescription>入居者へのメール通知設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailEnabled && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              メール通知機能は現在のプランでは利用できません
            </div>
          )}

          <div
            className="space-y-4"
            style={{ opacity: emailEnabled ? 1 : 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>請求発行通知</Label>
                <p className="text-sm text-muted-foreground">
                  請求書発行時に入居者へ通知
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
                <Label>支払期限リマインダー</Label>
                <p className="text-sm text-muted-foreground">
                  支払期限3日前に通知
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
                <Label>延滞通知</Label>
                <p className="text-sm text-muted-foreground">
                  支払期限超過時に通知
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
                <Label>支払確認通知</Label>
                <p className="text-sm text-muted-foreground">
                  支払登録完了時に通知
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
                <Label>契約期限リマインダー</Label>
                <p className="text-sm text-muted-foreground">
                  契約終了30日前に通知
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
            <CardTitle>SMS通知</CardTitle>
          </div>
          <CardDescription>
            入居者へのSMS通知設定（重要な通知のみ）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!smsEnabled && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              SMS通知機能は現在のプランでは利用できません
            </div>
          )}

          <div className="space-y-4" style={{ opacity: smsEnabled ? 1 : 0.5 }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>支払期限リマインダー</Label>
                <p className="text-sm text-muted-foreground">
                  支払期限3日前にSMS通知
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
                <Label>延滞通知</Label>
                <p className="text-sm text-muted-foreground">
                  支払期限超過時にSMS通知
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
                <Label>アカウント作成通知</Label>
                <p className="text-sm text-muted-foreground">
                  入居者登録時にログイン情報をSMS送信
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
          <CardTitle>送信元設定</CardTitle>
          <CardDescription>通知メールの送信元情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender_email">送信元メールアドレス</Label>
            <Input
              id="sender_email"
              type="email"
              placeholder="noreply@example.com"
              value={settings.sender_email || ""}
              onChange={(e) => updateSetting("sender_email", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              空欄の場合はシステムデフォルトを使用
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">送信元名</Label>
            <Input
              id="sender_name"
              placeholder="管理会社名"
              value={settings.sender_name || ""}
              onChange={(e) => updateSetting("sender_name", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              メールの「差出人」に表示される名前
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
              Хадгалах中...
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
