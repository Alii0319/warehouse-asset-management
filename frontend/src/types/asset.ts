export type AssetSource = 'MANUAL' | 'AUTOMATED';

export interface Asset {
  id: number;
  asset_id: string;
  category: string;
  photograph: string;
  photograph_url: string;
  created_at: string;
  created_date: string;
  created_time: string;
  source: AssetSource;
  external_reference: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PaginatedAssetsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Asset[];
}

export interface DashboardSummary {
  total_assets: number;
  today_entries: number;
  available_categories: number;
  categories: string[];
}

export interface CreateAssetInput {
  asset_id: string;
  category: string;
  photograph: File;
  external_reference?: string;
}

export type ApiFieldErrors = Record<string, string[]>;
