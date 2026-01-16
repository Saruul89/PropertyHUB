"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks";
import {
  Settings,
  Shield,
  Database,
  Mail,
  CreditCard,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { PlansConfig, EmailSettings } from "@/types/admin";

interface SystemSettings {
  plans: PlansConfig;
  email_settings: EmailSettings;
  maintenance_mode: boolean;
}

const defaultPlans: PlansConfig = {
  starter: { max_properties: 1, max_units: 50, price: 20 },
  basic: { max_properties: 1, max_units: 150, price: 50 },
  pro: { max_properties: 3, max_units: 500, price: 100 },
  enterprise: { max_properties: -1, max_units: -1, price: 0 },
};

const defaultEmailSettings: EmailSettings = {
  from_email: "noreply@propertyhub.mn",
  from_name: "PropertyHub",
  reply_to: "support@propertyhub.mn",
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SystemSettings>({
    plans: defaultPlans,
    email_settings: defaultEmailSettings,
    maintenance_mode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      if (data.success) {
        setSettings({
          plans: data.data.plans || defaultPlans,
          email_settings: data.data.email_settings || defaultEmailSettings,
          maintenance_mode:
            data.data.maintenance_mode === "true" ||
            data.data.maintenance_mode === true,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Тохиргоог татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plans: settings.plans,
          email_settings: settings.email_settings,
          maintenance_mode: settings.maintenance_mode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Тохиргоог амжилттай хадгаллаа");
      } else {
        toast.error(data.error || "Хадгалахад алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (
    plan: keyof PlansConfig,
    field: keyof PlansConfig["starter"],
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [plan]: {
          ...prev.plans[plan],
          [field]: value,
        },
      },
    }));
  };

  const updateEmailSettings = (field: keyof EmailSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      email_settings: {
        ...prev.email_settings,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Системийн тохиргоо</h1>
          <p className="text-gray-600">
            PropertyHub-ийн ерөнхий тохиргоог удирдана
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Хадгалж байна..." : "Тохиргоо хадгалах"}
        </Button>
      </div>

      {/* Maintenance Mode Warning */}
      {settings.maintenance_mode && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Засварын горим идэвхжсэн
                </p>
                <p className="text-sm text-orange-600">
                  Энгийн хэрэглэгчид системд нэвтрэх боломжгүй
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Админ мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Нэвтрэх имэйл</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-gray-500">Хэрэглэгчийн ID</Label>
              <p className="font-medium text-sm text-gray-600">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Системийн төлөв
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Засварын горим</p>
              <p className="text-sm text-gray-500">
                Идэвхжүүлбэл зөвхөн админ нэвтрэх боломжтой болно
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, maintenance_mode: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Багцын тохиргоо
          </CardTitle>
          <CardDescription>
            Багц бүрийн хязгаар болон үнийг тохируулна (-1 = хязгааргүй)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(["starter", "basic", "pro", "enterprise"] as const).map(
              (plan) => (
                <div key={plan} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-4 capitalize">
                    {plan === "starter"
                      ? "Starter (Жижиг)"
                      : plan === "basic"
                      ? "Basic (Үндсэн)"
                      : plan === "pro"
                      ? "Pro (Мэргэжлийн)"
                      : "Enterprise (Байгууллага)"}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Хамгийн их барилгын тоо</Label>
                      <Input
                        type="number"
                        value={settings.plans[plan].max_properties}
                        onChange={(e) =>
                          updatePlan(
                            plan,
                            "max_properties",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Хамгийн их өрөөний тоо</Label>
                      <Input
                        type="number"
                        value={settings.plans[plan].max_units}
                        onChange={(e) =>
                          updatePlan(
                            plan,
                            "max_units",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Сарын төлбөр (₮)</Label>
                      <Input
                        type="number"
                        value={settings.plans[plan].price}
                        onChange={(e) =>
                          updatePlan(
                            plan,
                            "price",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Имэйлийн тохиргоо
          </CardTitle>
          <CardDescription>Системээс илгээх имэйлийн тохиргоо</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Илгээгчийн имэйл хаяг</Label>
              <Input
                type="email"
                value={settings.email_settings.from_email}
                onChange={(e) =>
                  updateEmailSettings("from_email", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Илгээгчийн нэр</Label>
              <Input
                value={settings.email_settings.from_name}
                onChange={(e) =>
                  updateEmailSettings("from_name", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Хариу илгээх имэйл хаяг</Label>
              <Input
                type="email"
                value={settings.email_settings.reply_to || ""}
                onChange={(e) =>
                  updateEmailSettings("reply_to", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Өгөгдлийн сангийн мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p>Өгөгдлийн сан Supabase-д удирдагдаж байна.</p>
            <p className="mt-2">
              Дэлгэрэнгүй тохиргоог Supabase хянах самбараас хийнэ үү.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Аюултай үйлдлүүд</CardTitle>
          <CardDescription>Эдгээр үйлдлийг буцаах боломжгүй</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">
                Өгөгдлийн санг дахин тохируулах
              </p>
              <p className="text-sm text-red-600">
                Бүх өгөгдлийг устгана (зөвхөн хөгжүүлэлтийн орчинд)
              </p>
            </div>
            <Button variant="destructive" disabled>
              Дахин тохируулах
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
