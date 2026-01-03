'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const propertySchema = z.object({
    name: z.string().min(1, 'Барилгын нэр заавал бөглөнө'),
    property_type: z.enum(['apartment', 'office']),
    address: z.string().min(1, 'Хаяг заавал бөглөнө'),
    description: z.string().optional(),
    total_floors: z.number().min(1, 'Давхрын тоо 1-ээс дээш байна'),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
    const router = useRouter();
    const { companyId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            property_type: 'apartment',
            total_floors: 1,
        },
    });

    const onSubmit = async (data: PropertyFormData) => {
        if (!companyId) return;

        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error: insertError } = await supabase.from('properties').insert({
            company_id: companyId,
            name: data.name,
            property_type: data.property_type,
            address: data.address,
            description: data.description || null,
            total_floors: data.total_floors,
        });

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
            return;
        }

        router.push('/dashboard/properties');
    };

    return (
        <>
            <Header title="Барилга нэмэх" showBack />
            <div className="p-6">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader>
                        <CardTitle>Шинэ барилга бүртгэх</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <Label>Барилгын төрөл</Label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="apartment"
                                            {...register('property_type')}
                                        />
                                        Орон сууц
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="office"
                                            {...register('property_type')}
                                        />
                                        Оффис
                                    </label>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="name">Барилгын нэр</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="Жишээ: Найрамдал байр"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="address">Хаяг</Label>
                                <Input
                                    id="address"
                                    {...register('address')}
                                    placeholder="Жишээ: Улаанбаатар хот..."
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.address.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="total_floors">Нийт давхар</Label>
                                <Input
                                    id="total_floors"
                                    type="number"
                                    min={1}
                                    {...register('total_floors', { valueAsNumber: true })}
                                />
                                {errors.total_floors && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.total_floors.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Тайлбар (сонголтоор)</Label>
                                <textarea
                                    id="description"
                                    {...register('description')}
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Барилгын тайлбар..."
                                />
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
