'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { companyType: 'apartment' },
    });

    const selectedType = watch('companyType');

    const onSubmit = async (data: RegisterInput) => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Supabase Auth でユーザー作成
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        company_name: data.companyName,
                        phone: data.phone,
                        role: 'property_manager',
                    },
                },
            });

            if (authError) throw authError;

            // 会社登録API呼び出し
            const res = await fetch('/api/auth/register-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user?.id,
                    companyName: data.companyName,
                    email: data.email,
                    phone: data.phone,
                    companyType: data.companyType,
                }),
            });

            if (!res.ok) {
                const resData = await res.json();
                throw new Error(resData.message || 'Бүртгэл амжилтгүй боллоо');
            }

            router.refresh();
            router.push('/dashboard');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Бүртгэл амжилтгүй боллоо');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Бүртгүүлэх</CardTitle>
                    <CardDescription>PropertyHub бүртгэл үүсгэх</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* 会社タイプ選択 */}
                        <div className="space-y-2">
                            <Label>Компанийн төрөл</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setValue('companyType', 'apartment')}
                                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                                        selectedType === 'apartment'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Home
                                        className={`h-6 w-6 ${
                                            selectedType === 'apartment' ? 'text-blue-600' : 'text-gray-500'
                                        }`}
                                    />
                                    <span
                                        className={`text-sm font-medium ${
                                            selectedType === 'apartment' ? 'text-blue-600' : 'text-gray-700'
                                        }`}
                                    >
                                        Орон сууц
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('companyType', 'office')}
                                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                                        selectedType === 'office'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Building2
                                        className={`h-6 w-6 ${
                                            selectedType === 'office' ? 'text-blue-600' : 'text-gray-500'
                                        }`}
                                    />
                                    <span
                                        className={`text-sm font-medium ${
                                            selectedType === 'office' ? 'text-blue-600' : 'text-gray-700'
                                        }`}
                                    >
                                        Оффис
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Компанийн нэр</Label>
                            <Input
                                id="companyName"
                                {...register('companyName')}
                                placeholder="Компанийн нэр"
                            />
                            {errors.companyName && (
                                <p className="text-red-500 text-sm">{errors.companyName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Имэйл</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="example@company.com"
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Утасны дугаар</Label>
                            <Input id="phone" {...register('phone')} placeholder="99001234" />
                            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Нууц үг</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="8 тэмдэгтээс дээш"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="Нууц үгээ дахин оруулна уу"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <span className="text-gray-600">Бүртгэлтэй бол</span>{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Нэвтрэх
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
