'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/types';
import { useAuth } from './use-auth';

export function useCompany() {
    const { companyId } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        const fetchCompany = async () => {
            const { data } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            setCompany(data);
            setLoading(false);
        };

        fetchCompany();
    }, [companyId, supabase]);

    return { company, loading };
}
