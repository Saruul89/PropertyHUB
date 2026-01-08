'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

interface AuthContextValue extends AuthState {
    signOut: () => Promise<void>;
}

const initialState: AuthState = {
    user: null,
    session: null,
    loading: true,
    role: null,
    companyId: null,
    tenantId: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<AuthState>(initialState);

    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;
        let isInitialized = false; // 初期化完了フラグ
        let isUpdating = false; // 更新中フラグ（重複実行防止）
        const startTime = performance.now();
        console.log('[AuthProvider] useEffect started');

        const updateUserInfo = async (session: Session) => {
            // 重複実行防止
            if (isUpdating) {
                console.log('[AuthProvider] updateUserInfo skipped - already updating');
                return;
            }
            isUpdating = true;
            if (!isMounted) return;

            const email = session.user.email || '';
            const userId = session.user.id;
            console.log('[AuthProvider] updateUserInfo called for:', email);

            try {
                if (isTenantEmail(email)) {
                    const tenantStart = performance.now();
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('id, company_id')
                        .eq('user_id', userId)
                        .maybeSingle();
                    console.log(`[AuthProvider] tenant query took ${(performance.now() - tenantStart).toFixed(0)}ms`);

                    if (isMounted) {
                        setState({
                            user: session.user,
                            session,
                            loading: false,
                            role: 'tenant',
                            companyId: tenant?.company_id || null,
                            tenantId: tenant?.id || null,
                        });
                        console.log(`[AuthProvider] DONE (tenant) - total ${(performance.now() - startTime).toFixed(0)}ms`);
                    }
                    return;
                }

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
                        console.log(`[AuthProvider] DONE (system_admin) - total ${(performance.now() - startTime).toFixed(0)}ms`);
                    }
                    return;
                }

                let companyUser = null;
                try {
                    const companyStart = performance.now();
                    console.log('[AuthProvider] fetching company_users for userId:', userId);

                    // Promise.race でタイムアウト制御（より確実）
                    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
                        setTimeout(() => {
                            console.log('[AuthProvider] company_users query TIMEOUT after 2s');
                            resolve({ data: null, error: { message: 'Query timeout' } });
                        }, 2000);
                    });

                    const queryPromise = supabase
                        .from('company_users')
                        .select('company_id, role')
                        .eq('user_id', userId)
                        .limit(1)
                        .single();

                    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

                    console.log(`[AuthProvider] company_users query took ${(performance.now() - companyStart).toFixed(0)}ms`);
                    console.log('[AuthProvider] company_users result:', { data, error });

                    if (error) {
                        console.log('[AuthProvider] company_users ERROR:', error.message);
                    }

                    companyUser = data;
                } catch (e) {
                    console.log('[AuthProvider] company_users EXCEPTION:', e);
                }

                // Fallback: ユーザーメタデータからcompanyIdを取得
                let finalCompanyId = companyUser?.company_id || null;
                let finalRole = companyUser?.role === 'admin' ? 'company_admin' : 'company_staff';

                if (!finalCompanyId) {
                    // メタデータにcompany_idがある場合はそれを使用
                    const metadataCompanyId = session.user.user_metadata?.company_id;
                    if (metadataCompanyId) {
                        console.log('[AuthProvider] Using companyId from user metadata:', metadataCompanyId);
                        finalCompanyId = metadataCompanyId;
                        finalRole = 'company_staff'; // デフォルトロール
                    }
                }

                if (isMounted) {
                    setState({
                        user: session.user,
                        session,
                        loading: false,
                        role: finalRole as 'company_admin' | 'company_staff',
                        companyId: finalCompanyId,
                        tenantId: null,
                    });
                    console.log(`[AuthProvider] DONE (company_user) - total ${(performance.now() - startTime).toFixed(0)}ms, companyId:`, finalCompanyId);
                }
            } catch (e) {
                console.log('[AuthProvider] updateUserInfo ERROR:', e);
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
            } finally {
                isUpdating = false;
            }
        };

        const initAuth = async () => {
            try {
                console.log('[AuthProvider] initAuth - getting user...');
                const sessionStart = performance.now();

                // セキュリティ警告を回避するため getUser() を使用
                // getSession() は cookie から直接読み込むため認証されていない可能性がある
                const { data: { user }, error } = await supabase.auth.getUser();
                console.log(`[AuthProvider] getUser took ${(performance.now() - sessionStart).toFixed(0)}ms, hasUser:`, !!user, 'error:', error?.message);

                if (!isMounted) return;

                if (user && !error) {
                    // セッションを取得してupdateUserInfoに渡す
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        await updateUserInfo(session);
                    } else {
                        setState(prev => ({ ...prev, loading: false }));
                        console.log('[AuthProvider] No session after getUser - setting loading false');
                    }
                } else {
                    setState(prev => ({ ...prev, loading: false }));
                    console.log('[AuthProvider] No user - setting loading false');
                }
            } catch (e) {
                console.log('[AuthProvider] initAuth ERROR:', e);
                if (isMounted) {
                    setState(prev => ({ ...prev, loading: false }));
                }
            } finally {
                isInitialized = true;
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                console.log('[AuthProvider] onAuthStateChange event:', event, 'isInitialized:', isInitialized);

                // INITIAL_SESSIONは常にスキップ
                if (event === 'INITIAL_SESSION') {
                    console.log('[AuthProvider] Skipping INITIAL_SESSION');
                    return;
                }

                // 初期化前のSIGNED_INイベントはinitAuthで処理するのでスキップ
                if (event === 'SIGNED_IN' && !isInitialized) {
                    console.log('[AuthProvider] Skipping SIGNED_IN (handled by initAuth)');
                    return;
                }

                // TOKEN_REFRESHEDとSIGNED_IN（初期化後）は無視
                // これらはバックグラウンド復帰時やトークン更新時に発火するが、
                // 既にセッションがある場合は再クエリ不要
                if (event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && isInitialized)) {
                    console.log('[AuthProvider] Skipping', event, '- session already loaded');
                    return;
                }

                if (!isMounted) return;

                if (session) {
                    console.log('[AuthProvider] onAuthStateChange calling updateUserInfo');
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
        try {
            // scope: 'local' を使用してローカルセッションのみをクリア
            // これにより403エラーを回避できる
            await supabase.auth.signOut({ scope: 'local' });
        } catch (error) {
            console.error('[AuthProvider] signOut error:', error);
            // エラーが発生しても状態をリセットしてログインページへ
        }
        // 状態をリセット
        setState({
            ...initialState,
            loading: false,
        });
        router.push('/login');
    }, [router]);

    return (
        <AuthContext.Provider value={{ ...state, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

export { AuthContext };
