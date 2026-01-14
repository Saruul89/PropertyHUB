"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { getTenantColumns } from "@/components/features/tenants/tenant-columns";
import { useAuth } from "@/hooks";
import {
  useTenants,
  useDeleteTenant,
  usePropertiesSimple,
  filterTenants,
} from "@/hooks/queries";
import type { TenantFilters } from "@/hooks/queries";
import type { TenantType } from "@/types";
import { TableSkeleton } from "@/components/skeletons";
import { Plus, Users, Search, Building2, X } from "lucide-react";

type AssignmentFilter = "all" | "assigned" | "unassigned";

export default function TenantsPage() {
  const { companyId } = useAuth();
  const { data: tenants = [], isLoading: loading } = useTenants(companyId);
  const { data: properties = [] } = usePropertiesSimple(companyId);
  const deleteTenant = useDeleteTenant();

  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TenantType | "all">("all");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all");

  const handleDelete = (id: string) => {
    if (!confirm("Энэ оршин суугчийг устгахдаа итгэлтэй байна уу?")) return;
    deleteTenant.mutate(id);
  };

  const columns = useMemo(
    () => getTenantColumns({ onDelete: handleDelete }),
    []
  );

  const filters: TenantFilters = {
    propertyId: propertyFilter,
    type: typeFilter,
    assignment: assignmentFilter,
  };

  const filteredTenants = useMemo(
    () => filterTenants(tenants, search, filters),
    [tenants, search, propertyFilter, typeFilter, assignmentFilter]
  );

  const hasActiveFilters =
    propertyFilter !== "all" ||
    typeFilter !== "all" ||
    assignmentFilter !== "all";

  const clearFilters = () => {
    setPropertyFilter("all");
    setTypeFilter("all");
    setAssignmentFilter("all");
  };

  return (
    <>
      <Header title="Оршин суугчид" />
      <div className="p-6">
        {/* Search and Add Button */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Нэр, утасны дугаараар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/dashboard/tenants/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Оршин суугч нэмэх
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Бүх барилга" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх барилга</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TenantType | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Бүх төрөл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх хүний төрөл</SelectItem>
              <SelectItem value="individual">Хувь хүн</SelectItem>
              <SelectItem value="company">Компани</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={assignmentFilter}
            onValueChange={(v) => setAssignmentFilter(v as AssignmentFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Бүх оршин суугчийн төлөв" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд өрөө</SelectItem>
              <SelectItem value="assigned">Өрөөтэй</SelectItem>
              <SelectItem value="unassigned">Өрөөгүй</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500"
            >
              <X className="mr-1 h-4 w-4" />
              Цэвэрлэх
            </Button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {filteredTenants.length} / {tenants.length} оршин суугч
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">
                {search
                  ? "Хайлтад тохирох оршин суугч олдсонгүй"
                  : "Оршин суугч бүртгэгдээгүй байна"}
              </p>
              {!search && (
                <Link href="/dashboard/tenants/new">
                  <Button>Эхний оршин суугч бүртгэх</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <DataTable columns={columns} data={filteredTenants} pageSize={20} />
        )}
      </div>
    </>
  );
}
