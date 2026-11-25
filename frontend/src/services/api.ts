import type {
  ApiFieldErrors,
  Asset,
  CreateAssetInput,
  DashboardSummary,
  PaginatedAssetsResponse,
} from '@/types/asset';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  fieldErrors: ApiFieldErrors;

  constructor(message: string, status: number, fieldErrors: ApiFieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let fieldErrors: ApiFieldErrors = {};
  let message = `Request failed with status ${response.status}`;

  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.detail === 'string') {
      message = data.detail;
    } else {
      const parsed: ApiFieldErrors = {};
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          parsed[key] = val.map(String);
        } else if (typeof val === 'string') {
          parsed[key] = [val];
        }
      }
      fieldErrors = parsed;
      const firstError = Object.values(parsed)[0]?.[0];
      if (firstError) {
        message = firstError;
      }
    }
  } catch {
    // Response body was not JSON; keep default status message.
  }

  throw new ApiError(message, response.status, fieldErrors);
}

export async function fetchAssets(params: {
  search?: string;
  page?: number;
}): Promise<PaginatedAssetsResponse> {
  const url = new URL(`${API_BASE_URL}/api/assets/`);
  if (params.search?.trim()) {
    url.searchParams.set('search', params.search.trim());
  }
  if (params.page && params.page > 1) {
    url.searchParams.set('page', String(params.page));
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  return handleResponse<PaginatedAssetsResponse>(response);
}

export async function fetchAssetById(id: string | number): Promise<Asset> {
  const response = await fetch(`${API_BASE_URL}/api/assets/${id}/`, {
    headers: { Accept: 'application/json' },
  });
  return handleResponse<Asset>(response);
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary/`, {
    headers: { Accept: 'application/json' },
  });
  return handleResponse<DashboardSummary>(response);
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const formData = new FormData();
  formData.append('asset_id', input.asset_id.trim());
  formData.append('category', input.category.trim());
  formData.append('photograph', input.photograph);
  if (input.external_reference?.trim()) {
    formData.append('external_reference', input.external_reference.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/assets/`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<Asset>(response);
}
