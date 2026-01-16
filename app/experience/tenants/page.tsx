'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Phone,
  Mail,
  Home,
  User,
  Building,
} from 'lucide-react';
import {
  mockTenants,
  mockUnits,
  mockProperties,
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

export default function ExperienceTenantsPage() {
  // Map tenants with their unit and property info
  const tenantsWithInfo = mockTenants.map((tenant, index) => {
    // Assign units to tenants (for demo purposes)
    const occupiedUnits = mockUnits.filter(u => u.status === 'occupied');
    const unit = occupiedUnits[index % occupiedUnits.length];
    const property = unit ? mockProperties.find(p => p.id === unit.property_id) : null;

    return {
      ...tenant,
      unit,
      property,
    };
  });

  const individualCount = mockTenants.filter(t => t.tenant_type === 'individual').length;
  const companyCount = mockTenants.filter(t => t.tenant_type === 'company').length;

  return (
    <>
      <ExperienceHeader title="Оршин суугчид" />

      <div className="p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Нийт оршин суугч</p>
                <p className="text-2xl font-bold">{mockTenants.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Хувь хүн</p>
                <p className="text-2xl font-bold">{individualCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Байгууллага</p>
                <p className="text-2xl font-bold">{companyCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оршин суугч
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төрөл
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Холбоо барих
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Байршил
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenantsWithInfo.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            tenant.tenant_type === 'company'
                              ? 'bg-purple-100'
                              : 'bg-blue-100'
                          }`}>
                            {tenant.tenant_type === 'company' ? (
                              <Building className={`h-5 w-5 text-purple-600`} />
                            ) : (
                              <User className={`h-5 w-5 text-blue-600`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tenant.name}</p>
                            {tenant.tenant_type === 'company' && tenant.contact_person_name && (
                              <p className="text-sm text-gray-500">
                                Холбоо барих: {tenant.contact_person_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={tenant.tenant_type === 'company' ? 'secondary' : 'outline'}>
                          {tenant.tenant_type === 'company' ? 'Байгууллага' : 'Хувь хүн'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {tenant.phone}
                          </div>
                          {tenant.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="truncate max-w-[180px]">{tenant.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {tenant.unit && tenant.property && (
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {tenant.unit.unit_number}-р өрөө
                              </p>
                              <p className="text-xs text-gray-500">
                                {tenant.property.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={tenant.is_active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                          }
                        >
                          {tenant.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info message about read-only */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Туршилтын горимд оршин суугч нэмэх, засах боломжгүй.
            <a href="/register" className="text-amber-600 hover:underline ml-1">Бүртгүүлэх</a>
          </p>
        </div>
      </div>
    </>
  );
}
