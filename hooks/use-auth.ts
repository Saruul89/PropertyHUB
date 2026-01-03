'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isTenantEmail, isSystemAdminEmail } from '@/lib/utils';
import type { UserRole } from '@/types';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: UserRole | null;
    companyId: string | null;
    tenantId: string | null;
}

const initialState: AuthState = {
    user: null,
    session: null,
    loading: true,
    role: null,
    companyId: null,
    tenantId: null,
};

export function useAuth() {
    const router = useRouter();
    const [state, setState] = useState<AuthState>(initialState);

    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;

        const updateUserInfo = async (session: Session) => {
            if (!isMounted) return;

            const email = session.user.email || '';
            const userId = session.user.id;

            try {
                // 入居者かどうかをチェック
                if (isTenantEmail(email)) {
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('id, company_id')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (isMounted) {
                        setState({
                            user: session.user,
                            session,
                            loading: false,
                            role: 'tenant',
                            companyId: tenant?.company_id || null,
                            tenantId: tenant?.id || null,
                        });
                    }
                    return;
                }

                // システム管理者かチェック（環境変数のメールで同期的に判定）
                if (isSystemAdminEmail(email)) {
                    if (isMounted) {
                        setState({
                            user: session.user,
                            session,
                            loading: false,
                            role: 'system_admin',
                            companyId: null,
                            tenantId: null,
                        });
                    }
                    return;
                }

                // 管理会社ユーザーかチェック（タイムアウト付き）
                let companyUser = null;
                try {
                    const result = await Promise.race([
                        supabase.from('company_users').select('company_id, role').eq('user_id', userId).maybeSingle(),
                        new Promise<{ data: null; error: Error }>((_, reject) =>
                            setTimeout(() => reject(new Error('timeout')), 3000)
                        )
                    ]);
                    companyUser = result.data;
                } catch {
                    // タイムアウト時はデフォルト使用
                }

                if (isMounted) {
                    setState({
                        user: session.user,
                        session,
                        loading: false,
                        role: companyUser?.role === 'admin' ? 'company_admin' : 'company_staff',
                        companyId: companyUser?.company_id || null,
                        tenantId: null,
                    });
                }
            } catch (err) {
                console.error('updateUserInfo error:', err);
                if (isMounted) {
                    setState({
                        user: session.user,
                        session,
                        loading: false,
                        role: null,
                        companyId: null,
                        tenantId: null,
                    });
                }
            }
        };

        // 初期セッション取得
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (session) {
                    await updateUserInfo(session);
                } else {
                    setState(prev => ({ ...prev, loading: false }));
                }
            } catch (err) {
                console.error('useAuth: init error', err);
                if (isMounted) {
                    setState(prev => ({ ...prev, loading: false }));
                }
            }
        };

        initAuth();

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (event === 'INITIAL_SESSION') return;
                if (!isMounted) return;

                if (session) {
                    await updateUserInfo(session);
                } else {
                    setState({
                        ...initialState,
                        loading: false,
                    });
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    }, [router]);

    return { ...state, signOut };
}
