'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth() {
    const context = useContext(AuthContext);

    // AuthProvider 外で使用された場合はデフォルト値を返す
    // (後方互換性のため)
    if (!context) {
        return {
            user: null,
            session: null,
            loading: true,
            role: null,
            companyId: null,
            tenantId: null,
            signOut: async () => {},
        };
    }

    return context;
}
