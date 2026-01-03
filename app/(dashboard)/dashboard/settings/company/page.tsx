"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Save, Building2 } from "lucide-react";
import type { Company } from "@/types";

export default function CompanySettingsPage() {
  const { companyId } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (data) {
      setCompany(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update(formData)
      .eq("id", companyId);

    if (error) {
      alert("Хадгалахад алдаа гарлаа");
    } else {
      alert("Амжилттай хадгаллаа");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="Компанийн мэдээлэл" showBack />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Үндсэн мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Компанийн нэр</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл хаяг</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Хаяг</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {company && (
        <Card>
          <CardHeader>
            <CardTitle>Бусад мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <Label className="text-gray-500">Компанийн төрөл</Label>
                <p className="font-medium">
                  {company.company_type === "apartment"
                    ? "Орон сууц удирдлага"
                    : "Оффис удирдлага"}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Бүртгүүлсэн огноо</Label>
                <p className="font-medium">
                  {new Date(company.created_at).toLocaleDateString("mn-MN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
