"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateBonumQr,
  usePaymentStatus,
  type BonumQrData,
} from "@/hooks/queries";
import {
  Building2,
  Home,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react";

const PLAN_INFO: Record<
  string,
  {
    name: string;
    nameEn: string;
    price: number;
    features: string[];
    popular?: boolean;
  }
> = {
  starter: {
    name: "Starter",
    nameEn: "Жижиг",
    price: 20,
    features: [
      "1 барилга удирдах",
      "50 хүртэлх өрөө",
      "Төлбөрийн төрөл тохируулах",
      "Имэйл мэдэгдэл",
      "Үндсэн тайлан",
    ],
  },
  basic: {
    name: "Basic",
    nameEn: "Үндсэн",
    price: 50,
    popular: true,
    features: [
      "1 барилга удирдах",
      "150 хүртэлх өрөө",
      "Төлбөрийн төрөл тохируулах",
      "Имэйл мэдэгдэл",
      "Үндсэн тайлан",
      "Давхрын зураг",
      "Гэрээний удирдлага",
      "Тоолуурын бүртгэл",
      "Хувьсах төлбөр",
    ],
  },
  pro: {
    name: "Pro",
    nameEn: "Мэргэжлийн",
    price: 100,
    features: [
      "3 барилга удирдах",
      "500 хүртэлх өрөө",
      "Төлбөрийн төрөл тохируулах",
      "Имэйл мэдэгдэл",
      "Үндсэн тайлан",
      "Давхрын зураг",
      "Гэрээний удирдлага",
      "Тоолуурын бүртгэл",
      "Хувьсах төлбөр",
      "Засвар үйлчилгээ удирдах",
      "Портал user удирдах",
      "SMS мэдэгдэл",
    ],
  },
};

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "basic";

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<BonumQrData | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [isPaid, setIsPaid] = useState(false);

  const createQr = useCreateBonumQr();
  const planInfo = PLAN_INFO[selectedPlan] || PLAN_INFO.starter;
  const price = planInfo.price;

  // Poll payment status when we have an invoiceId
  const { data: paymentStatus } = usePaymentStatus(qrData?.invoiceId ?? null, {
    enabled: !!qrData?.invoiceId && !isPaid,
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Update isPaid when payment is confirmed
  useEffect(() => {
    if (paymentStatus?.isPaid) {
      setIsPaid(true);
    }
  }, [paymentStatus]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { companyType: "apartment" },
    mode: "onChange",
  });

  const selectedType = watch("companyType");

  // Generate QR code on mount and when plan changes
  useEffect(() => {
    generateQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan]);

  const generateQr = async () => {
    setQrData(null);
    setIsPaid(false);
    const txId = `REG-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    setTransactionId(txId);

    createQr.mutate(
      {
        amount: price,
        transactionId: txId,
        expiresIn: 600,
        items: [
          {
            title: `PropertyHub ${planInfo.name} багц - 1 сар`,
            amount: price,
            count: 1,
          },
        ],
      },
      {
        onSuccess: (data) => {
          setQrData(data);
        },
      }
    );
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            company_name: data.companyName,
            phone: data.phone,
            role: "property_manager",
          },
        },
      });

      if (authError) throw authError;

      const res = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user?.id,
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
          companyType: data.companyType,
          plan: selectedPlan,
          transactionId: transactionId,
          invoiceId: qrData?.invoiceId,
          isPaid: isPaid,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || "Бүртгэл амжилтгүй боллоо");
      }

      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Бүртгэл амжилтгүй боллоо");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Буцах</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold">
              <span className="text-slate-900">Property</span>
              <span className="text-amber-500">Hub</span>
            </span>
          </Link>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Бүртгүүлэх
          </h1>
          <p className="mt-2 text-slate-500">Өөрт тохирох багц сонгоно уу</p>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 max-w-2xl mx-auto">
          {(["starter", "basic", "pro"] as const).map((planKey) => {
            const info = PLAN_INFO[planKey];
            const isSelected = selectedPlan === planKey;
            return (
              <button
                key={planKey}
                type="button"
                onClick={() => {
                  if (!isPaid) {
                    setSelectedPlan(planKey);
                  }
                }}
                disabled={isPaid}
                className={`relative p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 shadow-md"
                    : isPaid
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {info.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Түгээмэл
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-amber-700" : "text-slate-700"
                    }`}
                  >
                    {info.name}
                  </span>
                  <span
                    className={`text-lg md:text-xl font-bold ${
                      isSelected ? "text-amber-600" : "text-slate-900"
                    }`}
                  >
                    ₮{(info.price / 1000).toFixed(0)}к
                  </span>
                  <span className="text-[10px] text-slate-500">/сар</span>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left - Registration Form */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Мэдээлэл бөглөх
              </CardTitle>
              <CardDescription>
                Компанийн болон хувийн мэдээллээ оруулна уу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Company Type */}
                <div className="space-y-2">
                  <Label>Компанийн төрөл</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("companyType", "apartment")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedType === "apartment"
                          ? "border-amber-500 bg-amber-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Home
                        className={`h-5 w-5 ${
                          selectedType === "apartment"
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          selectedType === "apartment"
                            ? "text-amber-600"
                            : "text-slate-600"
                        }`}
                      >
                        Орон сууц
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("companyType", "office")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedType === "office"
                          ? "border-amber-500 bg-amber-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Building2
                        className={`h-5 w-5 ${
                          selectedType === "office"
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          selectedType === "office"
                            ? "text-amber-600"
                            : "text-slate-600"
                        }`}
                      >
                        Оффис
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Компанийн нэр</Label>
                  <Input
                    id="companyName"
                    {...register("companyName")}
                    placeholder="Компанийн нэр"
                    className="h-11"
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-xs">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Имэйл</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="example@company.com"
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Утасны дугаар</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="99001234"
                    className="h-11"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">Нууц үг</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="8+ тэмдэгт"
                      className="h-11"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="Давтах"
                      className="h-11"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Status Indicator */}
                <div
                  className={`p-3 rounded-xl flex items-center gap-3 ${
                    isPaid
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  {isPaid ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">
                          Төлбөр амжилттай
                        </p>
                        <p className="text-xs text-emerald-600">
                          Та бүртгэлээ дуусгах боломжтой
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-700">
                          Төлбөр хүлээгдэж байна
                        </p>
                        <p className="text-xs text-amber-600">
                          QR код уншуулж төлбөрөө төлнө үү
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full h-12 font-semibold mt-4 transition-all ${
                    isPaid
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  }`}
                  disabled={loading || !isValid || !isPaid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Бүртгэж байна...
                    </>
                  ) : isPaid ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Бүртгэл дуусгах
                    </>
                  ) : (
                    "Төлбөр төлсний дараа бүртгүүлэх"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-slate-500">Бүртгэлтэй бол</span>{" "}
                <Link
                  href="/login"
                  className="text-amber-600 hover:underline font-medium"
                >
                  Нэвтрэх
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Right - Payment QR */}
          <Card
            className={`border-0 shadow-xl transition-all ${
              isPaid ? "ring-2 ring-emerald-500" : ""
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                {isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <CreditCard className="h-5 w-5 text-amber-600" />
                )}
                {isPaid ? "Төлбөр амжилттай!" : "Төлбөр төлөх"}
              </CardTitle>
              <CardDescription>
                {isPaid
                  ? "Төлбөр баталгаажлаа. Бүртгэлээ дуусгана уу."
                  : "QR код уншуулж төлбөрөө төлнө үү"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Summary */}
              <div
                className={`rounded-xl p-4 border ${
                  isPaid
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50"
                    : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {planInfo.name} багц
                    </p>
                    <p className="text-xs text-slate-500">{planInfo.nameEn}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        isPaid ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      ₮{price.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">/сар</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {planInfo.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-600"
                    >
                      <Check
                        className={`h-3 w-3 ${
                          isPaid ? "text-emerald-600" : "text-amber-600"
                        }`}
                      />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Success */}
              {isPaid && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <p className="text-lg font-semibold text-emerald-700">
                    Төлбөр амжилттай!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Зүүн талд мэдээллээ бөглөөд бүртгэлээ дуусгана уу
                  </p>
                </div>
              )}

              {/* QR Code - Only show when not paid */}
              {!isPaid && (
                <>
                  {createQr.isPending && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
                      <p className="mt-4 text-sm text-slate-500">
                        QR код үүсгэж байна...
                      </p>
                    </div>
                  )}

                  {createQr.isError && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                        <AlertCircle className="h-7 w-7 text-red-600" />
                      </div>
                      <p className="text-center text-sm text-red-600">
                        {createQr.error?.message ||
                          "QR код үүсгэхэд алдаа гарлаа"}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={generateQr}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Дахин оролдох
                      </Button>
                    </div>
                  )}

                  {qrData && (
                    <>
                      <div className="flex justify-center">
                        <div className="rounded-2xl border-4 border-white bg-white p-2 shadow-lg">
                          <img
                            src={`data:image/png;base64,${qrData.qrImage}`}
                            alt="Payment QR Code"
                            width={180}
                            height={180}
                            className="h-[180px] w-[180px]"
                          />
                        </div>
                      </div>

                      <p className="text-center text-xs text-slate-500">
                        QR кодыг банкны апп-аар уншуулна уу
                      </p>

                      {/* Bank Apps */}
                      {qrData.links && qrData.links.length > 0 && (
                        <div>
                          <p className="mb-3 text-center text-xs font-medium text-slate-600">
                            Эсвэл банкны апп сонгох
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {qrData.links.slice(0, 8).map((link) => (
                              <a
                                key={link.name}
                                href={link.link}
                                className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-slate-100"
                              >
                                <img
                                  src={link.logo}
                                  alt={link.name}
                                  className="h-8 w-8 rounded-lg shadow-sm"
                                />
                                <span className="line-clamp-1 text-center text-[9px] text-slate-600">
                                  {link.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateQr}
                          className="text-slate-500"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          QR шинэчлэх
                        </Button>
                      </div>

                      <p className="text-center text-[10px] text-slate-400">
                        QR код 10 минутын дотор хүчинтэй
                      </p>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
