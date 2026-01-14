'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import type { CompanyUser } from '@/types/database';
import type { StaffFormData } from '@/lib/validations';

type CreateUserResponse = {
  user: CompanyUser;
  initialPassword: string;
};

async function fetchCompanyUsers(): Promise<CompanyUser[]> {
  const res = await fetch('/api/company-users');
  if (!res.ok) throw new Error('Failed to fetch company users');
  const data = await res.json();
  return data.users || [];
}

async function createCompanyUser(data: StaffFormData): Promise<CreateUserResponse> {
  const res = await fetch('/api/company-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Алдаа гарлаа');

  return {
    user: result.user,
    initialPassword: result.initialPassword,
  };
}

async function updateCompanyUser(params: { id: string; data: Partial<StaffFormData> }): Promise<void> {
  const { id, data } = params;
  const res = await fetch(`/api/company-users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      is_active: data.is_active,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Алдаа гарлаа');
  }
}

async function deleteCompanyUser(id: string): Promise<void> {
  const res = await fetch(`/api/company-users/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Устгахад алдаа гарлаа');
  }
}

export function useCompanyUsers(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.companyUsers.list(companyId!),
    queryFn: fetchCompanyUsers,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCompanyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompanyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyUsers.all });
    },
  });
}

export function useUpdateCompanyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompanyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyUsers.all });
    },
  });
}

export function useDeleteCompanyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyUsers.all });
    },
  });
}
