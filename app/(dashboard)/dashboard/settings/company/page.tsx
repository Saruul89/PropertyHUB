"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { companyProfileSchema, type CompanyProfileFormData } from "@/lib/validations";
import { Save, Building2, Upload, CreditCard, ImageIcon, Loader2 } from "lucide-react";
import type { Company } from "@/types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export default function CompanySettingsPage() {
  const { companyId } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      logo_url: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
      business_hours: "",
    },
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
      setLogoPreview(data.logo_url || null);
      reset({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        logo_url: data.logo_url || "",
        bank_name: data.settings?.bank_name || "",
        bank_account_number: data.settings?.bank_account_number || "",
        bank_account_name: data.settings?.bank_account_name || "",
        business_hours: data.settings?.business_hours || "",
      });
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Зөвхөн зураг файл (JPEG, PNG, GIF, WebP) байршуулах боломжтой");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Зургийн хэмжээ 2MB-аас хэтрэхгүй байх ёстой");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const storagePath = `logos/${companyId}/company-logo-${timestamp}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath);

      const logoUrl = urlData.publicUrl;
      setLogoPreview(logoUrl);
      setValue("logo_url", logoUrl);

      await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", companyId);

      alert("Лого амжилттай байршууллаа");
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("Лого байршуулахад алдаа гарлаа");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: CompanyProfileFormData) => {
    if (!companyId || !company) return;
    setSaving(true);

    try {
      const supabase = createClient();

      const updatedSettings = {
        ...company.settings,
        bank_name: data.bank_name || undefined,
        bank_account_number: data.bank_account_number || undefined,
        bank_account_name: data.bank_account_name || undefined,
        business_hours: data.business_hours || undefined,
      };

      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          logo_url: data.logo_url || null,
          settings: updatedSettings,
        })
        .eq("id", companyId);

      if (error) throw error;

      setCompany((prev) =>
        prev
          ? {
              ...prev,
              name: data.name,
              email: data.email,
              phone: data.phone || undefined,
              address: data.address || undefined,
              logo_url: data.logo_url || undefined,
              settings: updatedSettings,
            }
          : null
      );

      alert("Амжилттай хадгаллаа");
    } catch (error) {
      console.error("Save error:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
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
        title="Компанийн мэдээлэл"
        showBack
        action={
          <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Үндсэн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Компанийн лого"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {uploading ? "Байршуулж байна..." : "Лого байршуулах"}
                </Button>
                <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP (2MB хүртэл)</p>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Компанийн нэр <span className="text-red-500">*</span>
                    </Label>
                    <Input id="name" {...register("name")} placeholder="Компанийн нэр" />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Имэйл хаяг <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="info@company.mn"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Утасны дугаар <span className="text-red-500">*</span>
                </Label>
                <Input id="phone" {...register("phone")} placeholder="99001234" />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_hours">Ажлын цаг</Label>
                <Input
                  id="business_hours"
                  {...register("business_hours")}
                  placeholder="09:00 - 18:00"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Хаяг</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Улаанбаатар хот, ..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Төлбөрийн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Банкны нэр</Label>
                <Input
                  id="bank_name"
                  {...register("bank_name")}
                  placeholder="Голомт банк"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Дансны дугаар</Label>
                <Input
                  id="bank_account_number"
                  {...register("bank_account_number")}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Данс эзэмшигч</Label>
                <Input
                  id="bank_account_name"
                  {...register("bank_account_name")}
                  placeholder="Компанийн нэр"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {company && (
          <Card>
            <CardHeader>
              <CardTitle>Бусад мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm md:grid-cols-2">
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
      </form>
    </div>
  );
}
