'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import type { Property, Unit } from '@/types';
import { CheckCircle, Copy } from 'lucide-react';

const tenantSchema = z.object({
    name: z.string().min(1, 'Нэр заавал бөглөнө'),
    phone: z.string().min(8, 'Утасны дугаар 8 оронтой байна'),
    tenant_type: z.enum(['individual', 'company']),
    company_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    notes: z.string().optional(),
    unit_id: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

export default function NewTenantPage() {
    const router = useRouter();
    const { companyId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ password: string; phone: string } | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            tenant_type: 'individual',
        },
    });

    const tenantType = watch('tenant_type');

    useEffect(() => {
        if (companyId) {
            fetchProperties();
        }
    }, [companyId]);

    useEffect(() => {
        if (selectedPropertyId) {
            fetchUnits(selectedPropertyId);
        } else {
            setUnits([]);
        }
    }, [selectedPropertyId]);

    const fetchProperties = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true);

        if (data) {
            setProperties(data);
        }
    };

    const fetchUnits = async (propertyId: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from('units')
            .select('*')
            .eq('property_id', propertyId)
            .eq('status', 'vacant')
            .order('unit_number');

        if (data) {
            setUnits(data);
        }
    };

    const onSubmit = async (data: TenantFormData) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    phone: data.phone,
                    tenantType: data.tenant_type,
                    companyName: data.company_name,
                    unitId: data.unit_id || null,
                    notes: data.notes,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || 'Оршин суугч үүсгэхэд алдаа гарлаа');
            }

            setSuccess({
                password: result.initialPassword,
                phone: data.phone,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Оршин суугч үүсгэхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (success) {
            await navigator.clipboard.writeText(
                `Утас: ${success.phone}\nАнхны нууц үг: ${success.password}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (success) {
        return (
            <>
                <Header title="Оршин суугч нэмэх" showBack />
                <div className="p-6">
                    <Card className="mx-auto max-w-md">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                                <h2 className="mb-2 text-xl font-semibold">Бүртгэл амжилттай</h2>
                                <p className="mb-6 text-gray-600">
                                    Оршин суугчийн бүртгэл үүслээ
                                </p>

                                <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
                                    <p className="mb-2 text-sm text-gray-600">Нэвтрэх мэдээлэл</p>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-500">Утас:</span>
                                            <span className="ml-2 font-mono font-medium">
                                                {success.phone}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">
                                                Анхны нууц үг:
                                            </span>
                                            <span className="ml-2 font-mono font-medium">
                                                {success.password}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleCopy}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        {copied ? 'Хуулагдлаа' : 'Нэвтрэх мэдээлэл хуулах'}
                                    </Button>
                                    <Button
                                        className="w-full"
                                        onClick={() => router.push('/dashboard/tenants')}
                                    >
                                        Оршин суугчдын жагсаалт руу буцах
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Оршин суугч нэмэх" showBack />
            <div className="p-6">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader>
                        <CardTitle>Шинэ оршин суугч бүртгэх</CardTitle>
                        <p className="text-sm text-gray-500">
                            Нууц үг автоматаар үүсгэгдэнэ (8 оронтой тоо)
                        </p>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <Label>Оршин суугчийн төрөл</Label>
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

                            <div>
                                <Label htmlFor="phone">Утасны дугаар (Нэвтрэх нэр болно)</Label>
                                <Input id="phone" type="tel" {...register('phone')} placeholder="99001234" />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.phone.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="email">Имэйл (сонголтоор)</Label>
                                <Input id="email" type="email" {...register('email')} />
                            </div>

                            <div className="border-t pt-4">
                                <Label>Өрөө хуваарилах (сонголтоор)</Label>
                                <div className="mt-2 grid grid-cols-2 gap-4">
                                    <Select
                                        value={selectedPropertyId}
                                        onValueChange={setSelectedPropertyId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Барилга сонгох" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map((property) => (
                                                <SelectItem key={property.id} value={property.id}>
                                                    {property.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Controller
                                        name="unit_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || ''}
                                                onValueChange={field.onChange}
                                                disabled={!selectedPropertyId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Өрөө сонгох" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.map((unit) => (
                                                        <SelectItem key={unit.id} value={unit.id}>
                                                            {unit.unit_number}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                {selectedPropertyId && units.length === 0 && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Сул өрөө байхгүй
                                    </p>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <Label>Яаралтай холбоо барих (сонголтоор)</Label>
                                <div className="mt-2 grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="Холбоо барих нэр"
                                        {...register('emergency_contact_name')}
                                    />
                                    <Input
                                        placeholder="Утасны дугаар"
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
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Бүртгэж байна...' : 'Бүртгэх'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
