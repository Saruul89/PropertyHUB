"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  Billing,
  BillingItem,
  Payment,
  Tenant,
  Unit,
  PaymentMethod,
} from "@/types";
import {
  Receipt,
  User,
  Home,
  Calendar,
  CreditCard,
  Plus,
  X,
  CheckCircle,
  Printer,
  Clock,
  Check,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface BillingWithDetails extends Billing {
  tenant?: Tenant;
  unit?: Unit & { property?: { name: string } };
}

const paymentSchema = z.object({
  amount: z.number().min(1, "Дүн 1-ээс их байх ёстой"),
  payment_date: z.string().min(1, "Төлсөн огноо заавал"),
  payment_method: z.enum(["cash", "bank_transfer", "card"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Бэлэн мөнгө",
  bank_transfer: "Банкны шилжүүлэг",
  card: "Карт",
};

export default function BillingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billingId = params.id as string;

  const [billing, setBilling] = useState<BillingWithDetails | null>(null);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [approvingPaymentId, setApprovingPaymentId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method: "cash",
      payment_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    fetchBillingDetails();
  }, [billingId]);

  const fetchBillingDetails = async () => {
    const supabase = createClient();

    // Fetch billing with details
    const { data: billingData, error: billingError } = await supabase
      .from("billings")
      .select(
        `
                *,
                tenants(*),
                units(*, properties(name))
            `
      )
      .eq("id", billingId)
      .single();

    if (billingError || !billingData) {
      router.push("/dashboard/billings");
      return;
    }

    setBilling({
      ...billingData,
      tenant: billingData.tenants,
      unit: billingData.units
        ? { ...billingData.units, property: billingData.units.properties }
        : undefined,
    });

    // Fetch billing items
    const { data: itemsData } = await supabase
      .from("billing_items")
      .select("*")
      .eq("billing_id", billingId)
      .order("created_at");

    if (itemsData) {
      setBillingItems(itemsData);
    }

    // Fetch completed payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("billing_id", billingId)
      .eq("status", "completed")
      .order("payment_date", { ascending: false });

    if (paymentsData) {
      setPayments(paymentsData);
    }

    // Fetch pending payments (payment claims from tenants)
    const { data: pendingData } = await supabase
      .from("payments")
      .select("*")
      .eq("billing_id", billingId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingData) {
      setPendingPayments(pendingData);
    }

    setLoading(false);
  };

  const onSubmitPayment = async (data: PaymentFormData) => {
    if (!billing) return;
    setSubmitting(true);

    const supabase = createClient();

    // Create payment
    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        billing_id: billingId,
        lease_id: billing.lease_id,
        company_id: billing.company_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_month: billing.billing_month,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        notes: data.notes || null,
        status: "completed",
      })
      .select()
      .single();

    if (!paymentError && newPayment) {
      // Update billing status and paid_amount
      const newPaidAmount = billing.paid_amount + data.amount;
      let newStatus: Billing["status"] = billing.status;

      if (newPaidAmount >= billing.total_amount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial";
      }

      const { error: updateError } = await supabase
        .from("billings")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_at: newStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", billingId);

      if (!updateError) {
        setBilling({
          ...billing,
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_at:
            newStatus === "paid" ? new Date().toISOString() : billing.paid_at,
        });
        setPayments([newPayment, ...payments]);
      }
    }

    setSubmitting(false);
    setShowPaymentForm(false);
    reset({
      amount: 0,
      payment_method: "cash",
      payment_date: new Date().toISOString().split("T")[0],
    });
  };

  const openPaymentForm = () => {
    if (!billing) return;
    const remainingAmount = billing.total_amount - billing.paid_amount;
    reset({
      amount: remainingAmount,
      payment_method: "cash",
      payment_date: new Date().toISOString().split("T")[0],
    });
    setShowPaymentForm(true);
  };

  const approvePaymentClaim = async (payment: Payment) => {
    if (!billing) return;
    setApprovingPaymentId(payment.id);

    const supabase = createClient();

    // Update payment status to completed
    const { error: paymentError } = await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("id", payment.id);

    if (paymentError) {
      alert("Алдаа гарлаа");
      setApprovingPaymentId(null);
      return;
    }

    // Update billing status and paid_amount
    const newPaidAmount = billing.paid_amount + payment.amount;
    let newStatus: Billing["status"] = billing.status;

    if (newPaidAmount >= billing.total_amount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partial";
    }

    const { error: updateError } = await supabase
      .from("billings")
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        paid_at: newStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", billingId);

    if (!updateError) {
      setBilling({
        ...billing,
        paid_amount: newPaidAmount,
        status: newStatus,
        paid_at: newStatus === "paid" ? new Date().toISOString() : billing.paid_at,
      });
      setPayments([{ ...payment, status: "completed" }, ...payments]);
      setPendingPayments(pendingPayments.filter((p) => p.id !== payment.id));
    }

    setApprovingPaymentId(null);
  };

  const rejectPaymentClaim = async (paymentId: string) => {
    if (!confirm("Төлбөрийн мэдэгдлийг татгалзах уу?")) return;
    setApprovingPaymentId(paymentId);

    const supabase = createClient();

    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", paymentId);

    if (!error) {
      setPendingPayments(pendingPayments.filter((p) => p.id !== paymentId));
    }

    setApprovingPaymentId(null);
  };

  if (loading) {
    return (
      <>
        <Header title="Нэхэмжлэлийн дэлгэрэнгүй" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  if (!billing) {
    return null;
  }

  const remainingAmount = billing.total_amount - billing.paid_amount;
  const isPaid = billing.status === "paid";

  return (
    <>
      <Header title="Нэхэмжлэлийн дэлгэрэнгүй" showBack />
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {billing.billing_number || "Нэхэмжлэл"}
              </h2>
              <p className="text-gray-500">
                {new Date(billing.billing_month).toLocaleDateString("mn-MN", {
                  year: "numeric",
                  month: "long",
                })}
                -ийн нэхэмжлэл
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Хэвлэх
              </Button>
              {!isPaid && (
                <Button onClick={openPaymentForm}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Төлбөр бүртгэх
                </Button>
              )}
            </div>
          </div>

          {/* Status Banner */}
          {isPaid && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Төлбөр төлөгдсөн</p>
                <p className="text-sm text-green-600">
                  {billing.paid_at &&
                    new Date(billing.paid_at).toLocaleDateString("mn-MN")}
                  -нд төлөгдсөн
                </p>
              </div>
            </div>
          )}

          {/* Billing Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Түрээслэгчийн мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{billing.tenant?.name}</p>
                <p className="text-sm text-gray-500">{billing.tenant?.phone}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4" />
                  Үл хөдлөх хөрөнгийн мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{billing.unit?.property?.name}</p>
                <p className="text-sm text-gray-500">
                  Өрөөний дугаар: {billing.unit?.unit_number}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Billing Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Нэхэмжлэлийн задаргаа
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="pb-2 text-left text-sm font-medium text-gray-500">
                      Нэр төрөл
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">
                      Тоо хэмжээ
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">
                      Нэгж үнэ
                    </th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">
                      Дүн
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {billingItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <p className="font-medium">{item.fee_name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">
                        ₮{item.unit_price.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium">
                        ₮{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t">
                  <tr>
                    <td colSpan={3} className="py-3 text-right font-medium">
                      Дүн
                    </td>
                    <td className="py-3 text-right font-medium">
                      ₮{billing.subtotal.toLocaleString()}
                    </td>
                  </tr>
                  {billing.tax_amount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-right font-medium">
                        Татвар
                      </td>
                      <td className="py-3 text-right font-medium">
                        ₮{billing.tax_amount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr className="text-lg">
                    <td colSpan={3} className="py-3 text-right font-bold">
                      Нийт дүн
                    </td>
                    <td className="py-3 text-right font-bold">
                      ₮{billing.total_amount.toLocaleString()}
                    </td>
                  </tr>
                  {billing.paid_amount > 0 && (
                    <>
                      <tr className="text-green-600">
                        <td colSpan={3} className="py-3 text-right font-medium">
                          Төлсөн
                        </td>
                        <td className="py-3 text-right font-medium">
                          -₮{billing.paid_amount.toLocaleString()}
                        </td>
                      </tr>
                      {remainingAmount > 0 && (
                        <tr className="text-red-600">
                          <td colSpan={3} className="py-3 text-right font-bold">
                            Үлдэгдэл
                          </td>
                          <td className="py-3 text-right font-bold">
                            ₮{remainingAmount.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Pending Payment Claims */}
          {pendingPayments.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                  Баталгаажуулах төлбөр ({pendingPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4"
                    >
                      <div>
                        <p className="font-medium text-amber-800">
                          ₮{payment.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString("mn-MN")}
                        </div>
                        {payment.notes && (
                          <p className="mt-1 text-sm text-gray-500">{payment.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => approvePaymentClaim(payment)}
                          disabled={approvingPaymentId === payment.id}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {approvingPaymentId === payment.id ? "..." : "Батлах"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => rejectPaymentClaim(payment.id)}
                          disabled={approvingPaymentId === payment.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Татгалзах
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Төлбөрийн түүх
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-gray-500">
                  Төлбөрийн түүх байхгүй байна
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          ₮{payment.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString(
                            "mn-MN"
                          )}
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {
                              paymentMethodLabels[
                                payment.payment_method as PaymentMethod
                              ]
                            }
                          </span>
                        </div>
                      </div>
                      {payment.reference_number && (
                        <span className="font-mono text-sm text-gray-500">
                          {payment.reference_number}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due Date Info */}
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Төлөх хугацаа</p>
                <p className="font-medium">
                  {new Date(billing.due_date).toLocaleDateString("mn-MN")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Төлбөр бүртгэх</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPaymentForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmitPayment)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="amount">Дүн</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">₮</span>
                      <Input
                        id="amount"
                        type="number"
                        {...register("amount", { valueAsNumber: true })}
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.amount.message}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Үлдэгдэл: ₮{remainingAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="payment_date">Төлсөн огноо</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      {...register("payment_date")}
                    />
                    {errors.payment_date && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.payment_date.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Төлбөрийн хэлбэр</Label>
                    <div className="mt-2 flex gap-2">
                      {(
                        Object.keys(paymentMethodLabels) as PaymentMethod[]
                      ).map((method) => (
                        <label
                          key={method}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="radio"
                            value={method}
                            {...register("payment_method")}
                          />
                          {paymentMethodLabels[method]}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reference_number">Лавлах дугаар (заавал биш)</Label>
                    <Input
                      id="reference_number"
                      {...register("reference_number")}
                      placeholder="Шилжүүлгийн дугаар гэх мэт"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Тэмдэглэл (заавал биш)</Label>
                    <textarea
                      id="notes"
                      {...register("notes")}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPaymentForm(false)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? "Бүртгэж байна..." : "Төлбөр бүртгэх"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
