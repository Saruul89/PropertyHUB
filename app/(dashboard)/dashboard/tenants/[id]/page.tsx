'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Tenant, Lease, Unit, Property } from '@/types';
import { Phone, Home, Calendar, Copy, Building2, Plus } from 'lucide-react';

const tenantSchema = z.object({
    name: z.string().min(1, 'Нэр заавал бөглөнө'),
    phone: z.string().min(8, 'Утасны дугаар 8 оронтой байна'),
    tenant_type: z.enum(['individual', 'company']),
    company_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

type LeaseWithUnit = Lease & {
    unit?: Unit & { property?: Property };
};

type PropertyWithUnits = Property & {
    units: Unit[];
};

export default function TenantDetailPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params.id as string;
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [leases, setLeases] = useState<LeaseWithUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Assign room modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [monthlyRent, setMonthlyRent] = useState<string>('');
    const [assigningRoom, setAssigningRoom] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
    });

    const tenantType = watch('tenant_type');

    useEffect(() => {
        fetchTenant();
    }, [tenantId]);

    const fetchTenant = async () => {
        const supabase = createClient();

        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenantData) {
            router.push('/dashboard/tenants');
            return;
        }

        setTenant(tenantData);
        reset({
            name: tenantData.name,
            phone: tenantData.phone,
            tenant_type: tenantData.tenant_type,
            company_name: tenantData.company_name || '',
            email: tenantData.email || '',
            emergency_contact_name: tenantData.emergency_contact_name || '',
            emergency_contact_phone: tenantData.emergency_contact_phone || '',
            notes: tenantData.notes || '',
        });

        // Fetch leases
        const { data: leasesData } = await supabase
            .from('leases')
            .select('*, units(*, properties(*))')
            .eq('tenant_id', tenantId)
            .order('start_date', { ascending: false });

        if (leasesData) {
            setLeases(
                leasesData.map((lease: Record<string, unknown>) => ({
                    ...lease,
                    unit: lease.units
                        ? {
                              ...(lease.units as Unit),
                              property: (lease.units as Record<string, unknown>)
                                  .properties as Property | undefined,
                          }
                        : undefined,
                })) as LeaseWithUnit[]
            );
        }

        setLoading(false);
    };

    const fetchPropertiesWithVacantUnits = async () => {
        const supabase = createClient();

        const { data: propertiesData } = await supabase
            .from('properties')
            .select('*, units(*)')
            .eq('is_active', true);

        if (propertiesData) {
            // Filter to only properties with vacant units
            const propertiesWithVacant = propertiesData
                .map((property: Property & { units: Unit[] }) => ({
                    ...property,
                    units: property.units.filter(
                        (unit) => unit.status === 'vacant' && unit.is_active
                    ),
                }))
                .filter((property: PropertyWithUnits) => property.units.length > 0);

            setProperties(propertiesWithVacant);
        }
    };

    const handleOpenAssignModal = () => {
        setAssignError(null);
        setSelectedPropertyId('');
        setSelectedUnitId('');
        setMonthlyRent('');
        fetchPropertiesWithVacantUnits();
        setAssignModalOpen(true);
    };

    const handlePropertyChange = (propertyId: string) => {
        setSelectedPropertyId(propertyId);
        setSelectedUnitId('');
        const property = properties.find((p) => p.id === propertyId);
        if (property && property.units.length > 0) {
            setMonthlyRent(property.units[0].monthly_rent.toString());
        }
    };

    const handleUnitChange = (unitId: string) => {
        setSelectedUnitId(unitId);
        const property = properties.find((p) => p.id === selectedPropertyId);
        const unit = property?.units.find((u) => u.id === unitId);
        if (unit) {
            setMonthlyRent(unit.monthly_rent.toString());
        }
    };

    const handleAssignRoom = async () => {
        if (!selectedUnitId || !monthlyRent) {
            setAssignError('Бүх талбарыг бөглөнө үү');
            return;
        }

        setAssigningRoom(true);
        setAssignError(null);

        try {
            const response = await fetch('/api/leases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    unit_id: selectedUnitId,
                    start_date: new Date().toISOString().split('T')[0],
                    monthly_rent: parseFloat(monthlyRent),
                    deposit: 0,
                    payment_due_day: 1,
                    status: 'active',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Өрөө хуваарилахад алдаа гарлаа');
            }

            setAssignModalOpen(false);
            fetchTenant(); // Refresh data
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Алдаа гарлаа');
        } finally {
            setAssigningRoom(false);
        }
    };

    const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
    const hasActiveOrPendingLease = leases.some(
        (lease) => lease.status === 'active' || lease.status === 'pending'
    );

    const onSubmit = async (data: TenantFormData) => {
        setSaving(true);
        setError(null);

        const supabase = createClient();
        const { error: updateError } = await supabase
            .from('tenants')
            .update({
                name: data.name,
                tenant_type: data.tenant_type,
                company_name: data.company_name || null,
                email: data.email || null,
                emergency_contact_name: data.emergency_contact_name || null,
                emergency_contact_phone: data.emergency_contact_phone || null,
                notes: data.notes || null,
            })
            .eq('id', tenantId);

        if (updateError) {
            setError(updateError.message);
        } else {
            router.push('/dashboard/tenants');
        }

        setSaving(false);
    };

    const handleCopy = async () => {
        if (tenant?.initial_password) {
            await navigator.clipboard.writeText(
                `Утас: ${tenant.phone}\nАнхны нууц үг: ${tenant.initial_password}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Оршин суугчийн дэлгэрэнгүй" showBack />
                <div className="flex h-64 items-center justify-center">
                    <div className="text-gray-500">Ачааллаж байна...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Оршин суугчийн дэлгэрэнгүй" showBack />
            <div className="p-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Tenant Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Оршин суугчийн мэдээлэл</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-4 rounded bg-red-50 p-3 text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <Label>Хэлбэр</Label>
                                    <Controller
                                        name="tenant_type"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="mt-2 flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="individual" id="individual" />
                                                    <Label htmlFor="individual" className="font-normal cursor-pointer">
                                                        Хувь хүн
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="company" id="company" />
                                                    <Label htmlFor="company" className="font-normal cursor-pointer">
                                                        Компани
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">
                                            {tenantType === 'company' ? 'Хариуцагчийн нэр' : 'Нэр'}
                                        </Label>
                                        <Input id="name" {...register('name')} />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    {tenantType === 'company' && (
                                        <div>
                                            <Label htmlFor="company_name">Компанийн нэр</Label>
                                            <Input id="company_name" {...register('company_name')} />
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="phone">
                                            Утасны дугаар (өөрчилөх боломжгүй)
                                        </Label>
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Имэйл</Label>
                                        <Input id="email" type="email" {...register('email')} />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="emergency_contact_name">
                                            Яаралтай үед холбоо барих нэр
                                        </Label>
                                        <Input
                                            id="emergency_contact_name"
                                            {...register('emergency_contact_name')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="emergency_contact_phone">
                                            Яаралтай үед холбоо барих утас
                                        </Label>
                                        <Input
                                            id="emergency_contact_phone"
                                            {...register('emergency_contact_phone')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Тэмдэглэл</Label>
                                    <Textarea id="notes" {...register('notes')} />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Цуцлах
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Хадгалаж байна...' : 'Хадгалах'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Login Info Card */}
                    {tenant?.initial_password && !tenant.password_changed && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Нэвтрэх мэдээлэл</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                Утасны дугаар:
                                            </span>
                                            <span className="font-mono font-medium">
                                                {tenant.phone}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="ml-6 text-sm text-gray-600">
                                                Анхны нууц үг:
                                            </span>
                                            <span className="font-mono font-medium">
                                                {tenant.initial_password}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleCopy}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        {copied ? 'Хуулсан' : 'Хуулах'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Leases Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Гэрээний түүх</CardTitle>
                            {!hasActiveOrPendingLease && (
                                <Button size="sm" onClick={handleOpenAssignModal}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Өрөө хуваарилах
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {leases.length === 0 ? (
                                <p className="text-gray-500">Гэрээний түүх байхгүй байна</p>
                            ) : (
                                <div className="space-y-4">
                                    {leases.map((lease) => (
                                        <div
                                            key={lease.id}
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">
                                                        {lease.unit?.property?.name}
                                                    </span>
                                                    <span className="text-gray-500">-</span>
                                                    <Home className="h-4 w-4 text-gray-400" />
                                                    <span>{lease.unit?.unit_number}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {lease.start_date}
                                                        {lease.end_date && ` ~ ${lease.end_date}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        lease.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : lease.status === 'expired'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {lease.status === 'active'
                                                        ? 'Идэвхитэй'
                                                        : lease.status === 'expired'
                                                        ? 'Дууссан'
                                                        : 'Цуцлагдсан'}
                                                </span>
                                                <p className="mt-1 font-medium">
                                                    ₮{lease.monthly_rent.toLocaleString()}/сар
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Assign Room Modal */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Өрөө хуваарилах</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {assignError && (
                            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                                {assignError}
                            </div>
                        )}

                        <div>
                            <Label>Барилга сонгох</Label>
                            <Select
                                value={selectedPropertyId}
                                onValueChange={handlePropertyChange}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Барилга сонгоно уу" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map((property) => (
                                        <SelectItem key={property.id} value={property.id}>
                                            {property.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {properties.length === 0 && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Сул өрөөтэй барилга байхгүй
                                </p>
                            )}
                        </div>

                        {selectedProperty && (
                            <div>
                                <Label>Өрөө сонгох</Label>
                                <Select
                                    value={selectedUnitId}
                                    onValueChange={handleUnitChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Өрөө сонгоно уу" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProperty.units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.unit_number} - ₮{unit.monthly_rent.toLocaleString()}/сар
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedUnitId && (
                            <div>
                                <Label>Сарын төлбөр</Label>
                                <Input
                                    type="number"
                                    value={monthlyRent}
                                    onChange={(e) => setMonthlyRent(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setAssignModalOpen(false)}
                            >
                                Цуцлах
                            </Button>
                            <Button
                                onClick={handleAssignRoom}
                                disabled={!selectedUnitId || assigningRoom}
                            >
                                {assigningRoom ? 'Хадгалж байна...' : 'Хуваарилах'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
