"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Save,
  ToggleLeft,
  ToggleRight,
  Home,
  Users,
  FileText,
  Droplet,
  Calculator,
  Wrench,
  Bell,
  BarChart3,
  Code,
  Map,
  Ban,
  Play,
  Trash2,
  CreditCard,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Company, Subscription, CompanyFeatures } from "@/types";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/admin";

interface FeatureConfig {
  key: keyof CompanyFeatures;
  label: string;
  description: string;
  icon: React.ElementType;
  category:
    | "property"
    | "billing"
    | "lease"
    | "maintenance"
    | "portal"
    | "notification"
    | "other";
}

const featureConfigs: FeatureConfig[] = [
  {
    key: "multi_property",
    label: "Олон барилга удирдлага",
    description: "Олон барилгыг удирдах боломжтой",
    icon: Building2,
    category: "property",
  },
  {
    key: "floor_plan",
    label: "Давхрын зураг",
    description: "Визуал давхрын зураг харуулах",
    icon: Map,
    category: "property",
  },
  {
    key: "meter_readings",
    label: "Тоолуурын бүртгэл",
    description: "Усны тоолуурын уншилт бүртгэх",
    icon: Droplet,
    category: "billing",
  },
  {
    key: "variable_fees",
    label: "Хувьсах төлбөр",
    description: "Хэрэглээнд суурилсан төлбөр тооцоо",
    icon: Calculator,
    category: "billing",
  },
  {
    key: "custom_fee_types",
    label: "Өөрчлөн тохируулсан төлбөрийн төрөл",
    description: "Өөрийн төлбөрийн төрөл үүсгэх",
    icon: FileText,
    category: "billing",
  },
  {
    key: "lease_management",
    label: "Дэлгэрэнгүй гэрээний удирдлага",
    description: "Гэрээний дэлгэрэнгүй мэдээллийг удирдах",
    icon: FileText,
    category: "lease",
  },
  {
    key: "lease_documents",
    label: "Гэрээний баримт бичиг",
    description: "Гэрээний баримт бичиг байршуулах, удирдах",
    icon: FileText,
    category: "lease",
  },
  {
    key: "maintenance_basic",
    label: "Үндсэн засвар",
    description: "Засварын хүсэлтийн удирдлага",
    icon: Wrench,
    category: "maintenance",
  },
  {
    key: "maintenance_vendor",
    label: "Гүйцэтгэгч удирдлага",
    description: "Гүйцэтгэгчийн мэдээлэл болон зардал хянах",
    icon: Wrench,
    category: "maintenance",
  },
  {
    key: "tenant_portal",
    label: "Түрээслэгчийн портал",
    description: "Түрээслэгчийн тусгай самбар",
    icon: Users,
    category: "portal",
  },
  {
    key: "tenant_meter_submit",
    label: "Тоолуур илгээх",
    description: "Түрээслэгч тоолуур илгээх боломжтой",
    icon: Droplet,
    category: "portal",
  },
  {
    key: "email_notifications",
    label: "Имэйл мэдэгдэл",
    description: "Имэйлээр мэдэгдэл илгээх",
    icon: Bell,
    category: "notification",
  },
  {
    key: "sms_notifications",
    label: "SMS мэдэгдэл",
    description: "SMS-ээр мэдэгдэл илгээх",
    icon: Bell,
    category: "notification",
  },
  {
    key: "reports_advanced",
    label: "Дэлгэрэнгүй тайлан",
    description: "Нарийвчилсан шинжилгээний тайлан",
    icon: BarChart3,
    category: "other",
  },
  {
    key: "api_access",
    label: "API холболт",
    description: "Гадаад API-тай холболт",
    icon: Code,
    category: "other",
  },
];

const categoryLabels: Record<string, string> = {
  property: "Барилга удирдлага",
  billing: "Төлбөр・Нэхэмжлэл",
  lease: "Гэрээний удирдлага",
  maintenance: "Засвар",
  portal: "Портал",
  notification: "Мэдэгдэл",
  other: "Бусад",
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<CompanyFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0 });

  // Dialog states
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] =
    useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Subscription edit form
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: "free" as SubscriptionPlan,
    price_per_month: 0,
    max_properties: 1,
    max_units: 50,
    status: "active" as SubscriptionStatus,
  });

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`);
      const data = await res.json();

      if (data.company) {
        setCompany(data.company);
        setFeatures(data.company.features as CompanyFeatures);

        const sub = data.company.subscriptions?.[0] || null;
        setSubscription(sub);

        if (sub) {
          setSubscriptionForm({
            plan: sub.plan || "free",
            price_per_month: sub.price_per_month || 0,
            max_properties: sub.max_properties || 1,
            max_units: sub.max_units || 50,
            status: sub.status || "active",
          });
        }

        setStats(data.stats || { properties: 0, units: 0, tenants: 0 });
      } else {
        router.push("/admin/companies");
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      router.push("/admin/companies");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key: keyof CompanyFeatures) => {
    if (!features) return;
    setFeatures({
      ...features,
      [key]: !features[key],
    });
  };

  const saveFeatures = async () => {
    if (!features) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Функцийн тохиргоог хадгаллаа");
      } else {
        toast.error(data.error || "Хадгалахад алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const resetFeatures = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/features`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setFeatures(data.data.features);
        toast.success("Функцийн тохиргоог шинэчиллээ");
      } else {
        toast.error(data.error || "Шинэчлэхэд алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Түр зогсоох шалтгаанаа оруулна уу");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Компанийг түр зогсоолоо");
        setIsSuspendDialogOpen(false);
        setSuspendReason("");
        fetchCompanyData();
      } else {
        toast.error(data.error || "Түр зогсооход алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/activate`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Компанийг дахин эхлүүллээ");
        fetchCompanyData();
      } else {
        toast.error(data.error || "Дахин эхлүүлэхэд алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== company?.name) {
      toast.error("Компанийн нэр таарахгүй байна");
      return;
    }

    if (!deleteReason.trim()) {
      toast.error("Устгах шалтгаанаа оруулна уу");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmName: deleteConfirmName,
          reason: deleteReason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Компанийг устгалаа");
        router.push("/admin/companies");
      } else {
        toast.error(data.error || "Устгахад алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const saveSubscription = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/subscription`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscriptionForm),
        }
      );
      const data = await res.json();

      if (data.success) {
        toast.success("Захиалгыг шинэчиллээ");
        setIsSubscriptionDialogOpen(false);
        fetchCompanyData();
      } else {
        toast.error(data.error || "Шинэчлэхэд алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const groupedFeatures = featureConfigs.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureConfig[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  if (!company || !features) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Буцах
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge
              className={
                company.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {company.is_active ? "Идэвхтэй" : "Түр зогссон"}
            </Badge>
          </div>
          <p className="text-gray-600">{company.email}</p>
        </div>
        <div className="flex gap-2">
          {company.is_active ? (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => setIsSuspendDialogOpen(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Түр зогсоох
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
              onClick={handleActivate}
              disabled={submitting}
            >
              <Play className="h-4 w-4 mr-2" />
              Дахин эхлүүлэх
            </Button>
          )}
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Устгах
          </Button>
        </div>
      </div>

      {/* Warning for suspended company */}
      {!company.is_active && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Энэ компани түр зогссон байна
                </p>
                <p className="text-sm text-orange-600">
                  Компанийн хэрэглэгчид болон түрээслэгчид нэвтрэх боломжгүй
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Info & Subscription */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Компанийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Компанийн төрөл</Label>
                <p className="font-medium">
                  {company.company_type === "apartment"
                    ? "Орон сууц удирдлага"
                    : "Оффис удирдлага"}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Утасны дугаар</Label>
                <p className="font-medium">{company.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-gray-500">Бүртгүүлсэн огноо</Label>
                <p className="font-medium">
                  {new Date(company.created_at).toLocaleDateString("mn-MN")}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Шинэчилсэн огноо</Label>
                <p className="font-medium">
                  {new Date(company.updated_at).toLocaleDateString("mn-MN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Захиалга</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubscriptionDialogOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Засах
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Төлөвлөгөө</Label>
                <p className="font-medium capitalize">
                  {subscription?.plan || "free"}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Сарын төлбөр</Label>
                <p className="font-medium">
                  ₮{(subscription?.price_per_month || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Дээд барилгын тоо</Label>
                <p className="font-medium">
                  {stats.properties} / {subscription?.max_properties || 1}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Дээд өрөөний тоо</Label>
                <p className="font-medium">
                  {stats.units} / {subscription?.max_units || 50}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Ашиглалтын байдал</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <Home className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">
                {stats.properties}
              </p>
              <p className="text-sm text-gray-600">Барилга</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{stats.units}</p>
              <p className="text-sm text-gray-600">Өрөө</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">
                {stats.tenants}
              </p>
              <p className="text-sm text-gray-600">Түрээслэгч</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Функцийн тохиргоо</CardTitle>
            <CardDescription>
              Энэ компанид ашиглах боломжтой функцүүдийг тохируулна
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFeatures}
              disabled={submitting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Шинэчлэх
            </Button>
            <Button onClick={saveFeatures} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.entries(groupedFeatures).map(
            ([category, categoryFeatures]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {categoryLabels[category]}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {categoryFeatures.map((feature) => {
                    const isEnabled = features[feature.key];
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.key}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                          isEnabled
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                        onClick={() => toggleFeature(feature.key)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 ${
                              isEnabled ? "text-blue-600" : "text-gray-400"
                            }`}
                          />
                          <div>
                            <p
                              className={`font-medium ${
                                isEnabled ? "text-blue-900" : "text-gray-700"
                              }`}
                            >
                              {feature.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        {isEnabled ? (
                          <ToggleRight className="h-6 w-6 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Компанийг түр зогсоох</DialogTitle>
            <DialogDescription>
              {company.name}{" "}
              -ийг түр зогсоовол компанийн хэрэглэгчид болон түрээслэгчид нэвтрэх боломжгүй болно.
              Өгөгдөл хадгалагдана.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspendReason">Түр зогсоох шалтгаан</Label>
              <Textarea
                id="suspendReason"
                placeholder="Түр зогсоох шалтгаанаа оруулна уу..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSuspendDialogOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={submitting}
            >
              {submitting ? "Боловсруулж байна..." : "Түр зогсоох"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Компанийг бүрмөсөн устгах
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                <strong>{company.name}</strong> -ийг устгах уу?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                <p className="font-medium text-red-800">
                  Анхааруулга: Энэ үйлдлийг буцаах боломжгүй
                </p>
                <p className="text-red-600 mt-1">
                  Дараах бүх өгөгдөл устгагдана:
                </p>
                <ul className="list-disc list-inside text-red-600 mt-1">
                  <li>Барилга ({stats.properties})</li>
                  <li>Өрөө ({stats.units})</li>
                  <li>Түрээслэгч ({stats.tenants})</li>
                  <li>Нэхэмжлэл・Төлбөрийн түүх</li>
                  <li>Засварын хүсэлт</li>
                  <li>Бүх баримт бичиг</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Баталгаажуулахын тулд компанийн нэрээ оруулна уу</Label>
                <Input
                  placeholder={company.name}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Устгах шалтгаан</Label>
                <Textarea
                  placeholder="Устгах шалтгаанаа оруулна уу..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting || deleteConfirmName !== company.name}
            >
              {submitting ? "Устгаж байна..." : "Бүрмөсөн устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription Edit Dialog */}
      <Dialog
        open={isSubscriptionDialogOpen}
        onOpenChange={setIsSubscriptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Захиалга засах</DialogTitle>
            <DialogDescription>
              {company.name}-ийн захиалгын тохиргоог өөрчлөх
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Төлөвлөгөө</Label>
              <Select
                value={subscriptionForm.plan}
                onValueChange={(value: SubscriptionPlan) =>
                  setSubscriptionForm({ ...subscriptionForm, plan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (Үнэгүй)</SelectItem>
                  <SelectItem value="basic">Basic (Үндсэн)</SelectItem>
                  <SelectItem value="pro">Pro (Мэргэжлийн)</SelectItem>
                  <SelectItem value="enterprise">
                    Enterprise (Байгууллага)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Сарын төлбөр (₮)</Label>
                <Input
                  type="number"
                  value={subscriptionForm.price_per_month}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      price_per_month: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  value={subscriptionForm.status}
                  onValueChange={(value: SubscriptionStatus) =>
                    setSubscriptionForm({ ...subscriptionForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Идэвхтэй</SelectItem>
                    <SelectItem value="trial">Туршилт</SelectItem>
                    <SelectItem value="past_due">Төлбөр хугацаа хэтэрсэн</SelectItem>
                    <SelectItem value="cancelled">Цуцлагдсан</SelectItem>
                    <SelectItem value="suspended">Түр зогссон</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дээд барилгын тоо</Label>
                <Input
                  type="number"
                  value={subscriptionForm.max_properties}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      max_properties: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Дээд өрөөний тоо</Label>
                <Input
                  type="number"
                  value={subscriptionForm.max_units}
                  onChange={(e) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      max_units: parseInt(e.target.value) || 50,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubscriptionDialogOpen(false)}
            >
              Цуцлах
            </Button>
            <Button onClick={saveSubscription} disabled={submitting}>
              {submitting ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
