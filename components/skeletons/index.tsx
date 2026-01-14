import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/header';

// Stats cards skeleton (4 cards in a row)
export const StatCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Quick actions skeleton (3 cards)
export const QuickActionsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Table skeleton with header and rows
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <Card>
    <CardContent className="p-0">
      <div className="space-y-0">
        <Skeleton className="h-12 w-full rounded-t-2xl rounded-b-none" />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Property grid skeleton (3-column)
export const PropertyGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(count)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="h-40 w-full rounded-b-none" />
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Lease card list skeleton
export const LeaseCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Maintenance/request cards skeleton
export const RequestCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton className={`w-full rounded-xl`} style={{ height }} />
    </CardContent>
  </Card>
);

// Small stats cards (for lease/maintenance pages)
export const SmallStatsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Financial stats skeleton (4 smaller cards with left border)
export const FinancialStatsSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-l-4 border-l-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Alerts section skeleton (list items in a card)
export const AlertsSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <Card>
    <CardContent className="p-4">
      <Skeleton className="mb-3 h-5 w-32" />
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Widget skeleton (compact card with link)
export const WidgetSkeleton = () => (
  <Card className="border-l-4 border-l-gray-200">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

// Full page skeleton for dashboard
export const DashboardSkeleton = () => (
  <>
    <Header title="Хянах самбар" />
    <div className="space-y-6 p-4 md:p-6">
      <StatCardsSkeleton />
      <FinancialStatsSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <AlertsSkeleton rows={3} />
        <AlertsSkeleton rows={3} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
      <div>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </>
);

// Full page skeleton for properties
export const PropertiesPageSkeleton = () => (
  <>
    <Header title="Барилга" />
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <PropertyGridSkeleton />
    </div>
  </>
);

// Inline properties skeleton (for use within existing page structure)
export const PropertiesSkeleton = () => <PropertyGridSkeleton />;

// Full page skeleton for tenants
export const TenantsSkeleton = () => (
  <>
    <Header title="Оршин суугчид" />
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-40" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  </>
);

// Full page skeleton for billings
export const BillingsSkeleton = () => (
  <>
    <Header title="Төлбөр нэхэмжлэх" />
    <div className="p-6">
      <div className="mb-6">
        <SmallStatsSkeleton />
      </div>
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  </>
);

// Full page skeleton for leases
export const LeasesSkeleton = () => (
  <>
    <Header title="Гэрээний удирдлага" />
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="mb-6">
        <SmallStatsSkeleton />
      </div>
      <LeaseCardsSkeleton />
    </div>
  </>
);

// Full page skeleton for maintenance
export const MaintenanceSkeleton = () => (
  <>
    <Header title="Засвар үйлчилгээ" />
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="mb-6">
        <SmallStatsSkeleton />
      </div>
      <RequestCardsSkeleton />
    </div>
  </>
);

// Full page skeleton for meter readings
export const MeterReadingsSkeleton = () => (
  <>
    <Header title="Тоолуур оруулах" />
    <div className="p-6">
      <div className="mb-6">
        <SmallStatsSkeleton />
      </div>
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  </>
);

// Full page skeleton for reports
export const ReportsSkeleton = () => (
  <>
    <Header title="Тайлан" />
    <div className="p-6">
      <div className="mb-6">
        <SmallStatsSkeleton />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>
      <TableSkeleton rows={5} />
    </div>
  </>
);

// Admin dashboard skeleton
export const AdminDashboardSkeleton = () => (
  <>
    <Header title="Системийн хянах самбар" />
    <div className="p-6">
      <div className="mb-6">
        <StatCardsSkeleton />
      </div>
      <Skeleton className="mb-4 h-6 w-48" />
      <TableSkeleton rows={5} />
    </div>
  </>
);

// Admin companies skeleton
export const AdminCompaniesSkeleton = () => (
  <>
    <Header title="Компаниуд" />
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton rows={10} />
    </div>
  </>
);

// Property detail skeleton
export const PropertyDetailSkeleton = () => (
  <>
    <Header title="Барилгын мэдээлэл" showBack />
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-32 w-48 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-5 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-4 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>
      <TableSkeleton rows={6} />
    </div>
  </>
);

// Tenant billings skeleton
export const TenantBillingsSkeleton = () => (
  <>
    <Header title="Миний төлбөрүүд" />
    <div className="p-6">
      <div className="mb-6">
        <SmallStatsSkeleton count={3} />
      </div>
      <LeaseCardsSkeleton count={5} />
    </div>
  </>
);

// Full page skeleton for floor plans
export const FloorPlansSkeleton = () => (
  <>
    <Header title="Давхрын зураг" />
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-[280px]" />
        <div className="flex gap-2 justify-between sm:justify-end">
          <div className="flex gap-1">
            <Skeleton className="h-9 w-9 sm:w-24 rounded-lg" />
            <Skeleton className="h-9 w-9 sm:w-24 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-9 sm:w-32 rounded-lg" />
        </div>
      </div>

      {/* Property cards grid skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-36 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </>
);

// Inline floor plan content skeleton (for secondary loading state)
export const FloorPlanContentSkeleton = () => (
  <div className="space-y-4">
    {/* Floor tabs with scroll buttons */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-11 w-11 rounded-lg flex-shrink-0" />
      <div className="flex gap-2 overflow-hidden flex-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-xl flex-shrink-0" />
        ))}
      </div>
      <Skeleton className="h-11 w-11 rounded-lg flex-shrink-0" />
    </div>

    {/* Stats cards - matching FloorStatisticsCards grid */}
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Floor plan card */}
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-[50vh] min-h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>

    {/* Legend */}
    <div className="flex flex-wrap gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);
