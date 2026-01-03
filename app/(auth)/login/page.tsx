'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { phoneToEmail, isSystemAdminEmail } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 管理会社用
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPassword, setCompanyPassword] = useState('');

    // 入居者用
    const [tenantPhone, setTenantPhone] = useState('');
    const [tenantPassword, setTenantPassword] = useState('');

    const handleCompanyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: companyEmail,
            password: companyPassword,
        });

        if (error) {
            setError('Имэйл эсвэл нууц үг буруу байна');
            setLoading(false);
            return;
        }

        // システム管理者かチェック（環境変数のメールで判定）
        if (isSystemAdminEmail(data.user.email)) {
            // システム管理者は /login を使えない
            await supabase.auth.signOut();
            setError('Систем админ нэвтрэх хуудсыг ашиглана уу');
            setLoading(false);
            return;
        }

        router.refresh();
        router.push('/dashboard');
    };

    const handleTenantLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const email = phoneToEmail(tenantPhone);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: tenantPassword,
        });

        if (error) {
            setError('Утасны дугаар эсвэл нууц үг буруу байна');
            setLoading(false);
            return;
        }

        router.refresh();
        router.push('/tenant/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        PropertyHu<button
                            type="button"
                            onClick={() => router.push('/admin-login')}
                            className="bg-transparent border-none p-0 m-0 font-bold text-inherit cursor-pointer hover:opacity-70 transition-opacity"
                        >b</button>
                    </CardTitle>
                    <CardDescription>Үл хөдлөх хөрөнгийн удирдлагын платформ</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="company">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="company" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Компани
                            </TabsTrigger>
                            <TabsTrigger value="tenant" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Оршин суугч
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="company" className="mt-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCompanyLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company-email">Имэйл</Label>
                                    <Input
                                        id="company-email"
                                        type="email"
                                        value={companyEmail}
                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                        placeholder="example@company.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company-password">Нууц үг</Label>
                                    <Input
                                        id="company-password"
                                        type="password"
                                        value={companyPassword}
                                        onChange={(e) => setCompanyPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Нэвтэрж байна...' : 'Нэвтрэх'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center text-sm">
                                <span className="text-gray-600">Бүртгэл байхгүй бол</span>{' '}
                                <Link href="/register" className="text-blue-600 hover:underline">
                                    Бүртгүүлэх
                                </Link>
                            </div>
                        </TabsContent>

                        <TabsContent value="tenant" className="mt-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleTenantLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tenant-phone">Утасны дугаар</Label>
                                    <Input
                                        id="tenant-phone"
                                        type="tel"
                                        value={tenantPhone}
                                        onChange={(e) => setTenantPhone(e.target.value)}
                                        placeholder="99001234"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tenant-password">Нууц үг</Label>
                                    <Input
                                        id="tenant-password"
                                        type="password"
                                        value={tenantPassword}
                                        onChange={(e) => setTenantPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Нэвтэрж байна...' : 'Нэвтрэх'}
                                </Button>
                            </form>

                            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                                ※ Бүртгэлийг удирдлагын компаниас авна
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
