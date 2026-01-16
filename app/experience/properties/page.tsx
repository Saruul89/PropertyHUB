'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Home,
  Users,
  Layers,
} from 'lucide-react';
import {
  mockProperties,
  mockUnits,
  mockCompany,
} from '@/lib/mock-data/experience-data';

// Experience Header
function ExperienceHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-10 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full bg-gray-50 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 pr-1">
            {mockCompany.name}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function ExperiencePropertiesPage() {
  // Calculate stats for each property
  const propertiesWithStats = mockProperties.map(property => {
    const propertyUnits = mockUnits.filter(u => u.property_id === property.id);
    const occupiedCount = propertyUnits.filter(u => u.status === 'occupied').length;
    const vacantCount = propertyUnits.filter(u => u.status === 'vacant').length;
    const occupancyRate = propertyUnits.length > 0
      ? ((occupiedCount / propertyUnits.length) * 100).toFixed(1)
      : '0';

    return {
      ...property,
      unitCount: propertyUnits.length,
      occupiedCount,
      vacantCount,
      occupancyRate,
    };
  });

  return (
    <>
      <ExperienceHeader title="Барилга" />

      <div className="p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Нийт барилга</p>
                <p className="text-2xl font-bold">{mockProperties.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Home className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Нийт өрөө</p>
                <p className="text-2xl font-bold">{mockUnits.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Сул өрөө</p>
                <p className="text-2xl font-bold">{mockUnits.filter(u => u.status === 'vacant').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <div className="grid gap-4 md:grid-cols-2">
          {propertiesWithStats.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-100">
                {property.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Building2 className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    {property.property_type === 'apartment' ? 'Орон сууц' : 'Оффис'}
                  </Badge>
                </div>
              </div>

              {/* Property Info */}
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{property.address}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Layers className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-semibold">{property.total_floors}</p>
                    <p className="text-xs text-gray-500">Давхар</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Home className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-semibold">{property.unitCount}</p>
                    <p className="text-xs text-gray-500">Өрөө</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-semibold text-emerald-600">{property.occupancyRate}%</p>
                    <p className="text-xs text-gray-500">Ачаалал</p>
                  </div>
                </div>

                {/* Vacancy info */}
                {property.vacantCount > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">{property.vacantCount}</span> сул өрөөтэй
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info message about read-only */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Туршилтын горимд барилга нэмэх, засах боломжгүй.
            <a href="/register" className="text-amber-600 hover:underline ml-1">Бүртгүүлэх</a>
          </p>
        </div>
      </div>
    </>
  );
}
