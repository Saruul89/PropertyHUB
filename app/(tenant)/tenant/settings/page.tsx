'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useTenant, useAuth } from '@/hooks';
import { Settings, Lock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function TenantSettingsPage() {
    const { tenant, lease, loading: tenantLoading, refetch } = useTenant();
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordChange = async () => {
        setError('');
        setSuccess('');

        if (!newPassword || !confirmPassword) {
            setError('Бүх талбарыг бөглөнө үү');
            return;
        }

        if (newPassword.length < 8) {
            setError('Нууц үг 8 тэмдэгтээс дээш байх ёстой');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Шинэ нууц үг таарахгүй байна');
            return;
        }

        setSaving(true);
        const supabase = createClient();

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            setError('Нууц үг шинэчлэхэд алдаа гарлаа: ' + updateError.message);
            setSaving(false);
            return;
        }

        // Update password_changed flag
        if (tenant && !tenant.password_changed) {
            await supabase
                .from('tenants')
                .update({ password_changed: true })
                .eq('id', tenant.id);
            refetch();
        }

        setSuccess('Нууц үг амжилттай шинэчлэгдлээ');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSaving(false);
    };

    if (tenantLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-gray-500">Ачааллаж байна...</div>
            </div>
        );
    }

    const unit = lease?.unit;
    const property = unit?.property;

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">Тохиргоо</h1>

            {/* Profile Info */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Хувийн мэдээлэл
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label className="text-gray-500">Нэр</Label>
                            <p className="font-medium">{tenant?.name}</p>
                        </div>
                        <div>
                            <Label className="text-gray-500">Утасны дугаар</Label>
                            <p className="flex items-center gap-2 font-medium">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {tenant?.phone}
                            </p>
                        </div>
                        {tenant?.email && (
                            <div>
                                <Label className="text-gray-500">Имэйл</Label>
                                <p className="flex items-center gap-2 font-medium">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    {tenant.email}
                                </p>
                            </div>
                        )}
                        <div>
                            <Label className="text-gray-500">Өрөө</Label>
                            <p className="font-medium">
                                {property?.name} - {unit?.unit_number} өрөө
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        ※ Мэдээлэл өөрчлөх бол удирдлагын компанитай холбогдоно уу
                    </p>
                </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Нууц үг солих
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!tenant?.password_changed && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <p className="flex items-center gap-2 text-sm text-yellow-800">
                                <AlertCircle className="h-4 w-4" />
                                Анхны нууц үг ашиглаж байна. Аюулгүй байдлын үүднээс нууц үгээ солихыг зөвлөж байна.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {success}
                            </p>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="newPassword">Шинэ нууц үг</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="8 тэмдэгтээс дээш"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Шинэ нууц үг давтах</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Дахин оруулна уу"
                            className="mt-1"
                        />
                    </div>

                    <Button
                        onClick={handlePasswordChange}
                        disabled={saving || !newPassword || !confirmPassword}
                        className="w-full"
                    >
                        {saving ? 'Шинэчилж байна...' : 'Нууц үг солих'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
