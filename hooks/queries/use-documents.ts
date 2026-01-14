'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

async function fetchDocumentDownloadUrl(documentId: string): Promise<string | null> {
  const res = await fetch(`/api/documents/${documentId}/download`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.url || null;
}

export function useDocumentDownloadUrl(documentId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.documents.downloadUrl(documentId!),
    queryFn: () => fetchDocumentDownloadUrl(documentId!),
    enabled: !!documentId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
