'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Home, Pencil, Trash2 } from 'lucide-react';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';
import type { Property } from '@/types';

interface PropertyCardProps {
    property: Property;
    onDelete?: (id: string) => void;
}

export function PropertyCard({ property, onDelete }: PropertyCardProps) {
    const handleDelete = () => {
        if (onDelete && confirm('この物件を削除しますか？')) {
            onDelete(property.id);
        }
    };

    return (
        <Card className="overflow-hidden">
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
                    {PROPERTY_TYPE_LABELS[property.property_type]}
                </span>
            </div>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <div className="flex gap-1">
                        <Link href={`/dashboard/properties/${property.id}`}>
                            <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                        {onDelete && (
                            <Button variant="ghost" size="sm" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        )}
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
                        <span>{property.total_units} 部屋</span>
                    </div>
                </div>
                <div className="mt-4">
                    <Link href={`/dashboard/properties/${property.id}/units`}>
                        <Button variant="outline" size="sm" className="w-full">
                            部屋を管理
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
