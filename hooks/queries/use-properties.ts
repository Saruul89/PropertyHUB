'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Property } from '@/types';

async function fetchProperties(companyId: string): Promise<Property[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];
  return data as Property[];
}

async function fetchPropertiesSimple(companyId: string): Promise<Pick<Property, 'id' | 'name'>[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];
  return data;
}

async function deleteProperty(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('properties')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export function useProperties(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.properties.list(companyId!),
    queryFn: () => fetchProperties(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Lightweight version for dropdowns/selects
export function usePropertiesSimple(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.properties.list(companyId!, { simple: true }),
    queryFn: () => fetchPropertiesSimple(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
}

// Filter utilities
export type PropertyFilters = {
  type: 'all' | 'apartment' | 'office';
};

export function filterProperties(
  properties: Property[],
  search: string,
  filters: PropertyFilters
): Property[] {
  const searchLower = search.toLowerCase().trim();

  return properties.filter((property) => {
    // Search filter
    if (searchLower) {
      const matchesSearch =
        property.name.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filters.type !== 'all' && property.property_type !== filters.type) {
      return false;
    }

    return true;
  });
}
