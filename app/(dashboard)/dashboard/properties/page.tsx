'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropertyCard } from '@/components/features/properties';
import { useAuth } from '@/hooks';
import {
  useProperties,
  useDeleteProperty,
  filterProperties,
} from '@/hooks/queries';
import type { PropertyFilters } from '@/hooks/queries';
import { PropertiesSkeleton } from '@/components/skeletons';
import { Plus, Building2, Search, X } from 'lucide-react';

type PropertyTypeFilter = PropertyFilters['type'];

export default function PropertiesPage() {
  const { companyId } = useAuth();
  const { data: properties = [], isLoading } = useProperties(companyId);
  const deleteProperty = useDeleteProperty();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PropertyTypeFilter>('all');

  const handleDelete = (id: string) => {
    deleteProperty.mutate(id);
  };

  const filters: PropertyFilters = { type: typeFilter };

  const filteredProperties = useMemo(
    () => filterProperties(properties, search, filters),
    [properties, search, typeFilter]
  );

  const hasActiveFilters = typeFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setSearch('');
  };

  return (
    <>
      <Header title="Барилга" />
      <div className="p-6">
        {/* Search and Add Button */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Нэр, хаягаар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Барилга нэмэх
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as PropertyTypeFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Бүх төрөл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх төрөл</SelectItem>
              <SelectItem value="apartment">Орон сууц</SelectItem>
              <SelectItem value="office">Оффис</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
              <X className="mr-1 h-4 w-4" />
              Цэвэрлэх
            </Button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {filteredProperties.length} / {properties.length} барилга
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <PropertiesSkeleton />
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">
                {search || hasActiveFilters
                  ? 'Хайлтад тохирох барилга олдсонгүй'
                  : 'Барилга бүртгэгдээгүй байна'}
              </p>
              {!search && !hasActiveFilters && (
                <Link href="/dashboard/properties/new">
                  <Button>Эхний барилга бүртгэх</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
