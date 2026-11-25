import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Cpu,
  Hash,
  Tag,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { AssetImage } from '@/components/AssetImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsset } from '@/hooks/useAssets';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading, isError, error } = useAsset(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-80 rounded-xl bg-slate-200" />
          <div className="h-80 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="rounded-full bg-red-50 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Asset record not found</h1>
            <p className="text-sm text-slate-500">
              {error instanceof Error
                ? error.message
                : 'The requested asset could not be retrieved.'}
            </p>
            <Link to="/" className="mt-2">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-slate-900">
              {asset.asset_id}
            </h1>
            <Badge variant="secondary">{asset.category}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Photograph */}
        <Card className="md:col-span-3 overflow-hidden">
          <CardHeader className="border-b border-slate-200 py-4">
            <CardTitle className="text-sm font-medium text-slate-700">
              Asset Photograph
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <AssetImage
                src={asset.photograph_url}
                alt={`Photograph of ${asset.asset_id}`}
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="md:col-span-2 h-fit">
          <CardHeader className="border-b border-slate-200 py-4">
            <CardTitle className="text-sm font-medium text-slate-700">
              Record Details
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-200 p-0">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Hash className="h-3.5 w-3.5" />
                Asset ID
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900">
                {asset.asset_id}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Tag className="h-3.5 w-3.5" />
                Category
              </span>
              <span className="text-sm font-medium text-slate-900">{asset.category}</span>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Created Date
              </span>
              <span className="text-sm text-slate-900">{asset.created_date}</span>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Created Time
              </span>
              <span className="text-sm text-slate-900">{asset.created_time} PKT</span>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Cpu className="h-3.5 w-3.5" />
                Source
              </span>
              <Badge variant={asset.source === 'AUTOMATED' ? 'info' : 'outline'}>
                {asset.source === 'AUTOMATED' ? 'Automated' : 'Manual'}
              </Badge>
            </div>

            {asset.external_reference && (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <span className="text-xs font-medium text-slate-500">External Ref</span>
                <span className="font-mono text-xs font-medium text-slate-900">
                  {asset.external_reference}
                </span>
              </div>
            )}

            {asset.metadata && Object.keys(asset.metadata).length > 0 && (
              <div className="px-5 py-3.5 space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Metadata</span>
                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200">
                  {JSON.stringify(asset.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
