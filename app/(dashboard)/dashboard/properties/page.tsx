'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { Property } from '@/types';
import { Plus, Building2, MapPin, Home, MoreVertical, Pencil, Trash2 } from 'lucide-react';

export default function PropertiesPage() {
    const { companyId } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (companyId) {
            fetchProperties();
        }
    }, [companyId]);

    const fetchProperties = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProperties(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Энэ барилгыг устгахдаа итгэлтэй байна уу?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('properties')
            .update({ is_active: false })
            .eq('id', id);

        if (!error) {
            setProperties(properties.filter((p) => p.id !== id));
        }
    };

    return (
        <>
            <Header title="Барилга" />
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-gray-600">Удирдаж буй барилгын жагсаалт</p>
                    <Link href="/dashboard/properties/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Барилга нэмэх
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500">Ачааллаж байна...</div>
                ) : properties.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-600">Барилга бүртгэгдээгүй байна</p>
                            <Link href="/dashboard/properties/new">
                                <Button>Эхний барилга бүртгэх</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => (
                            <Card key={property.id} className="overflow-hidden">
                                <div className="aspect-video bg-gray-100 relative">
                                    {property.image_url ? (
                                        <img
                                            src={property.image_url}
                                            alt={property.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Building2 className="h-16 w-16 text-gray-300" />
                                        </div>
                                    )}
                                    <span className="absolute right-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs text-white">
                                        {property.property_type === 'apartment'
                                            ? 'Орон сууц'
                                            : 'Оффис'}
                                    </span>
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{property.name}</CardTitle>
                                        <div className="flex gap-1">
                                            <Link href={`/dashboard/properties/${property.id}/units`}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-4 w-4" /> 
                                                    Өрөөг удирдах
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(property.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span className="truncate">{property.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            <span>{property.total_units} өрөө</span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Link href={`/dashboard/properties/${property.id}`}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                Дэлгэрэнгүй
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
