'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/types';
import { useAuth } from './use-auth';

// Module-level cache to prevent duplicate fetches
let companyCache: { id: string; data: Company; timestamp: number } | null = null;
let pendingFetch: { id: string; promise: Promise<Company | null> } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(companyId: string): boolean {
    if (!companyCache) return false;
    if (companyCache.id !== companyId) return false;
    if (Date.now() - companyCache.timestamp > CACHE_DURATION) return false;
    return true;
}

export function useCompany() {
    const { companyId } = useAuth();
    const [company, setCompany] = useState<Company | null>(() => {
        // Initialize from cache if valid
        if (companyId && isCacheValid(companyId)) {
            console.log('[useCompany] initialized from cache');
            return companyCache!.data;
        }
        return null;
    });
    const [loading, setLoading] = useState(() => {
        // Not loading if we have valid cache
        if (companyId && isCacheValid(companyId)) {
            return false;
        }
        return true;
    });

    useEffect(() => {
        console.log('[useCompany] useEffect, companyId:', companyId);
        if (!companyId) {
            setLoading(false);
            return;
        }

        // Check cache first
        if (isCacheValid(companyId)) {
            console.log('[useCompany] using cache (no fetch)');
            setCompany(companyCache!.data);
            setLoading(false);
            return;
        }

        const fetchCompany = async () => {
            // 既にフェッチ中なら、そのPromiseを待つ
            if (pendingFetch && pendingFetch.id === companyId) {
                console.log('[useCompany] waiting for pending fetch...');
                const data = await pendingFetch.promise;
                if (data) {
                    setCompany(data);
                }
                setLoading(false);
                return;
            }

            const startTime = performance.now();
            console.log('[useCompany] fetching company...');

            // フェッチ中フラグを設定
            const fetchPromise = (async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', companyId)
                    .single();
                console.log(`[useCompany] fetch took ${(performance.now() - startTime).toFixed(0)}ms`);

                if (data) {
                    // Update cache
                    companyCache = {
                        id: companyId,
                        data,
                        timestamp: Date.now(),
                    };
                }
                pendingFetch = null;
                return data;
            })();

            pendingFetch = { id: companyId, promise: fetchPromise };

            const data = await fetchPromise;
            if (data) {
                setCompany(data);
            }
            setLoading(false);
        };

        fetchCompany();
    }, [companyId]);

    return { company, loading };
}

// Helper to invalidate cache when needed (e.g., after company update)
export function invalidateCompanyCache() {
    companyCache = null;
}
