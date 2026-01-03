'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import { Tenant, Lease, Unit, Property, Company } from '@/types';

interface LeaseWithDetails extends Lease {
    unit?: Unit & { property?: Property };
}

interface TenantContextType {
    tenant: Tenant | null;
    lease: LeaseWithDetails | null;
    company: Company | null;
    loading: boolean;
    refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    lease: null,
    company: null,
    loading: true,
    refetch: async () => {},
});

export function useTenant() {
    const { user, role } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [lease, setLease] = useState<LeaseWithDetails | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTenantData = async () => {
        if (!user || role !== 'tenant') {
            setLoading(false);
            return;
        }

        const supabase = createClient();

        // Get tenant data
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (tenantError || !tenantData) {
            setLoading(false);
            return;
        }

        setTenant(tenantData);

        // Get active lease with unit and property info
        const { data: leaseData } = await supabase
            .from('leases')
            .select(`
                *,
                units(*, properties(*))
            `)
            .eq('tenant_id', tenantData.id)
            .eq('status', 'active')
            .order('start_date', { ascending: false })
            .limit(1)
            .single();

        if (leaseData) {
            const leaseWithDetails: LeaseWithDetails = {
                ...leaseData,
                unit: leaseData.units
                    ? {
                          ...(leaseData.units as Unit),
                          property: (leaseData.units as Record<string, unknown>)
                              .properties as Property,
                      }
                    : undefined,
            };
            setLease(leaseWithDetails);
        }

        // Get company data
        const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', tenantData.company_id)
            .single();

        if (companyData) {
            setCompany(companyData);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTenantData();
    }, [user, role]);

    return {
        tenant,
        lease,
        company,
        loading,
        refetch: fetchTenantData,
    };
}
