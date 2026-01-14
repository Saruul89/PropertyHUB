'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { tenantSchema, type TenantFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import type { Property, Unit, Tenant } from '@/types';

type TenantFormProps = {
    companyId: string;
    defaultValues?: Partial<Tenant>;
    onSubmit: (data: TenantFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    isEditing?: boolean;
};

export function TenantForm({
    companyId,
    defaultValues,
    onSubmit,
    onCancel,
    isLoading,
    isEditing,
}: TenantFormProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            tenant_type: defaultValues?.tenant_type || 'individual',
            name: defaultValues?.name || '',
            phone: defaultValues?.phone || '',
            company_name: defaultValues?.company_name || '',
            email: defaultValues?.email || '',
            emergency_contact_name: defaultValues?.emergency_contact_name || '',
            emergency_contact_phone: defaultValues?.emergency_contact_phone || '',
            notes: defaultValues?.notes || '',
        },
    });

    const tenantType = watch('tenant_type');

    useEffect(() => {
        if (companyId && !isEditing) {
            fetchProperties();
        }
    }, [companyId, isEditing]);

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

    return (
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
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
            </div>

            {tenantType === 'company' && (
                <div>
                    <Label htmlFor="company_name">Компанийн нэр</Label>
                    <Input id="company_name" {...register('company_name')} />
                </div>
            )}

            <div>
                <Label htmlFor="phone">
                    Утасны дугаар{!isEditing && ' (Нэвтрэх нэр болно)'}
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="99001234"
                    disabled={isEditing}
                    className={isEditing ? 'bg-gray-50' : ''}
                />
                {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="email">Имэйл (сонголтоор)</Label>
                <Input id="email" type="email" {...register('email')} />
            </div>

            {!isEditing && (
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
                        <p className="mt-2 text-sm text-gray-500">Сул өрөө байхгүй</p>
                    )}
                </div>
            )}

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
                <Button type="button" variant="outline" onClick={onCancel}>
                    Цуцлах
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading
                        ? 'Хадгалаж байна...'
                        : isEditing
                        ? 'Хадгалах'
                        : 'Бүртгэх'}
                </Button>
            </div>
        </form>
    );
}
