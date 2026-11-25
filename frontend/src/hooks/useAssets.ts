import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAsset,
  fetchAssetById,
  fetchAssets,
  fetchDashboardSummary,
} from '@/services/api';
import type { CreateAssetInput } from '@/types/asset';

export const assetKeys = {
  all: ['assets'] as const,
  list: (search: string, page: number) => ['assets', 'list', { search, page }] as const,
  detail: (id: string | number) => ['assets', 'detail', String(id)] as const,
  summary: ['dashboard', 'summary'] as const,
};

export function useAssets(search: string, page: number) {
  return useQuery({
    queryKey: assetKeys.list(search, page),
    queryFn: () => fetchAssets({ search, page }),
    placeholderData: (previousData) => previousData,
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id ?? ''),
    queryFn: () => fetchAssetById(id!),
    enabled: Boolean(id),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: assetKeys.summary,
    queryFn: fetchDashboardSummary,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => createAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: assetKeys.summary });
    },
  });
}
