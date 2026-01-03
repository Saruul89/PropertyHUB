'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeature } from '@/hooks';
import { Building2, Receipt, Users, Bell, CreditCard } from 'lucide-react';

interface SettingItem {
    href: string;
    title: string;
    description: string;
    icon: React.ElementType;
    feature?: string;
}

const settingItems: SettingItem[] = [
    {
        href: '/dashboard/settings/company',
        title: 'Компанийн мэдээлэл',
        description: 'Компанийн нэр, хаяг, холбоо барих мэдээлэл',
        icon: Building2,
    },
    {
        href: '/dashboard/settings/fee-types',
        title: 'Төлбөрийн төрлүүд',
        description: 'Үйлчилгээний хураамж, усны төлбөр гэх мэт',
        icon: Receipt,
        feature: 'custom_fee_types',
    },
    {
        href: '/dashboard/settings/users',
        title: 'Ажилтны удирдлага',
        description: 'Ажилтны бүртгэл нэмэх, удирдах',
        icon: Users,
    },
    {
        href: '/dashboard/settings/billing',
        title: 'Төлбөрийн тохиргоо',
        description: 'Нэхэмжлэх огноо, төлбөрийн хугацааны тохиргоо',
        icon: CreditCard,
    },
    {
        href: '/dashboard/settings/notifications',
        title: 'Мэдэгдлийн тохиргоо',
        description: 'Имэйл, SMS мэдэгдлийн тохиргоо',
        icon: Bell,
        feature: 'email_notifications',
    },
];

export default function SettingsPage() {
    const hasCustomFeeTypes = useFeature('custom_fee_types');
    const hasEmailNotifications = useFeature('email_notifications');

    const featureFlags: Record<string, boolean> = {
        custom_fee_types: hasCustomFeeTypes,
        email_notifications: hasEmailNotifications,
    };

    const filteredItems = settingItems.filter((item) => {
        if (!item.feature) return true;
        return featureFlags[item.feature];
    });

    return (
        <>
            <Header title="Тохиргоо" />
            <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}>
                                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                                <Icon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <CardTitle className="text-lg">{item.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
