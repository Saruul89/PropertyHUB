'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

type PaymentClaimInput = {
  billingId: string;
  tenantId: string;
  amount: number;
  notes?: string;
};

async function submitPaymentClaim(input: PaymentClaimInput): Promise<void> {
  const response = await fetch('/api/tenant/payment-claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      billing_id: input.billingId,
      amount: input.amount,
      notes: input.notes,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to submit payment claim');
  }
}

export function useSubmitPaymentClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitPaymentClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantPortal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.billings.all });
    },
  });
}
