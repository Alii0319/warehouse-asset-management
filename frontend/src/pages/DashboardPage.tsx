import {
  AlertCircle,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AssetImage } from '@/components/AssetImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAssets, useDashboardSummary } from '@/hooks/useAssets';
import { useDebounce } from '@/hooks/useDebounce';

export function DashboardPage() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const summaryQuery = useDashboardSummary();
  const assetsQuery = useAssets(debouncedSearch, page);

  const summary = summaryQuery.data;
  const assets = assetsQuery.data?.results ?? [];
  const totalCount = assetsQuery.data?.count ?? 0;
  const hasNext = Boolean(assetsQuery.data?.next);
  const hasPrevious = Boolean(assetsQuery.data?.previous);
  const isSearching = debouncedSearch.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Asset Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor warehouse inventory, search asset records, and register new equipment.
          </p>
        </div>
        <Link to="/assets/new" className="shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New Asset
          </Button>
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total Assets</p>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {summaryQuery.isLoading ? '—' : (summary?.total_assets ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Today&apos;s Entries</p>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <CalendarPlus className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {summaryQuery.isLoading ? '—' : (summary?.today_entries ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Available Categories</p>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {summaryQuery.isLoading ? '—' : (summary?.available_categories ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Records Card */}
      <Card>
        <CardHeader className="border-b border-slate-200 space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Recent Asset Records</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {assetsQuery.isLoading
                ? 'Loading records...'
                : `${totalCount} ${totalCount === 1 ? 'record' : 'records'} ${
                    isSearching ? `matching "${debouncedSearch.trim()}"` : 'in registry'
                  }`}
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Asset ID (e.g. AST-1001)"
              aria-label="Search assets by Asset ID"
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error State */}
          {assetsQuery.isError && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="rounded-full bg-red-50 p-3 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Unable to load asset records</p>
                <p className="mt-1 text-xs text-slate-500">
                  {assetsQuery.error instanceof Error
                    ? assetsQuery.error.message
                    : 'Please verify the backend API server is running.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => assetsQuery.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {assetsQuery.isLoading && !assetsQuery.isError && (
            <div className="divide-y divide-slate-200">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="h-12 w-12 rounded-lg bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-48 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty / No Results State */}
          {!assetsQuery.isLoading && !assetsQuery.isError && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                <Package className="h-6 w-6" />
              </div>
              {isSearching ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      No assets match &ldquo;{debouncedSearch.trim()}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try a different Asset ID or clear the search filter.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSearchInput('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-900">No assets registered yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add your first warehouse asset with a photograph to get started.
                    </p>
                  </div>
                  <Link to="/assets/new">
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      Add New Asset
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Desktop Table */}
          {!assetsQuery.isLoading && !assetsQuery.isError && assets.length > 0 && (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Created (PKT)</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <AssetImage
                              src={asset.photograph_url}
                              alt={`Asset ${asset.asset_id}`}
                              className="h-11 w-11 rounded-lg border border-slate-200 shrink-0"
                            />
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              {asset.asset_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="secondary">{asset.category}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={asset.source === 'AUTOMATED' ? 'info' : 'outline'}>
                            {asset.source === 'AUTOMATED' ? 'Automated' : 'Manual'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <div>{asset.created_date}</div>
                          <div className="text-xs text-slate-400">{asset.created_time}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/assets/${asset.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Small Tablet Cards */}
              <div className="divide-y divide-slate-200 md:hidden">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-start gap-3.5 p-4">
                    <AssetImage
                      src={asset.photograph_url}
                      alt={`Asset ${asset.asset_id}`}
                      className="h-16 w-16 rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-sm font-semibold text-slate-900">
                          {asset.asset_id}
                        </span>
                        <Badge variant="secondary" className="shrink-0">
                          {asset.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {asset.created_date} · {asset.created_time}
                      </p>
                      <div className="pt-1">
                        <Link to={`/assets/${asset.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {(hasNext || hasPrevious) && (
                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                  <p className="text-xs text-slate-500">Page {page}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevious}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
