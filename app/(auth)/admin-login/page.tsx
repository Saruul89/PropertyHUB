'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { isSystemAdminEmail } from '@/lib/utils';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Имэйл эсвэл нууц үг буруу байна');
            setLoading(false);
            return;
        }

        // システム管理者かチェック（環境変数のメールで判定）
        if (!isSystemAdminEmail(data.user.email)) {
            await supabase.auth.signOut();
            setError('Систем админ эрх байхгүй байна');
            setLoading(false);
            return;
        }

        router.refresh();
        router.push('/admin/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <Card className="w-full max-w-md border-gray-700 bg-gray-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <Shield className="h-10 w-10 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Систем Админ</CardTitle>
                    <CardDescription className="text-gray-400">Систем админ нэвтрэх</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/50 text-red-400 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-email" className="text-gray-200">Имэйл</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admin-password" className="text-gray-200">Нууц үг</Label>
                            <Input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Нэвтэрж байна...' : 'Админ нэвтрэх'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
