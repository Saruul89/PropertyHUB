"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Lease, Tenant, Unit, Property } from "@/types";
import { LeaseForm } from "@/components/features/lease-detail";
import { LeaseFormData } from "@/lib/validations";
import { useFeature } from "@/hooks";
import { AlertTriangle } from "lucide-react";

interface LeaseWithRelations extends Lease {
  tenant: Tenant;
  unit: Unit & { property: Property };
}

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = params.id as string;
  const hasLeaseManagement = useFeature("lease_management");

  const [lease, setLease] = useState<LeaseWithRelations | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [leaseId]);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push("/login");
      return;
    }

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.user.id)
      .single();

    if (!companyUser) {
      router.push("/dashboard");
      return;
    }

    setCompanyId(companyUser.company_id);

    const { data: leaseData } = await supabase
      .from("leases")
      .select(
        `
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `
      )
      .eq("id", leaseId)
      .eq("company_id", companyUser.company_id)
      .single();

    if (!leaseData) {
      router.push("/dashboard/leases");
      return;
    }

    setLease(leaseData as LeaseWithRelations);
    setLoading(false);
  };

  const handleSubmit = async (data: LeaseFormData) => {
    if (!lease) return;

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("leases")
      .update({
        tenant_id: data.tenant_id,
        unit_id: data.unit_id,
        start_date: data.start_date,
        end_date: data.end_date || null,
        monthly_rent: data.monthly_rent,
        deposit: data.deposit || 0,
        payment_due_day: data.payment_due_day || 1,
        status: data.status,
        terms: data.terms || {},
        notes: data.notes || null,
      })
      .eq("id", leaseId);

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    // Update unit status if needed
    if (data.unit_id !== lease.unit_id) {
      // Set old unit to vacant
      await supabase
        .from("units")
        .update({ status: "vacant" })
        .eq("id", lease.unit_id);

      // Set new unit to occupied
      await supabase
        .from("units")
        .update({ status: "occupied" })
        .eq("id", data.unit_id);
    }

    router.push(`/dashboard/leases/${leaseId}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/leases/${leaseId}`);
  };

  if (loading) {
    return (
      <>
        <Header title="契約засах" showBack />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  if (!hasLeaseManagement) {
    return (
      <>
        <Header title="契約засах" showBack />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
              <p className="text-gray-500">
                契約管理機能が有効になっていません。
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!lease || !companyId) {
    return null;
  }

  const defaultValues: Partial<LeaseFormData> = {
    tenant_id: lease.tenant_id,
    unit_id: lease.unit_id,
    start_date: lease.start_date,
    end_date: lease.end_date || "",
    monthly_rent: lease.monthly_rent,
    deposit: lease.deposit,
    payment_due_day: lease.payment_due_day,
    status: lease.status,
    terms: lease.terms as LeaseFormData["terms"],
    notes: lease.notes || "",
  };

  return (
    <>
      <Header title="契約засах" showBack />
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
              {error}
            </div>
          )}

          <LeaseForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            isEditing
            companyId={companyId}
          />
        </div>
      </div>
    </>
  );
}
