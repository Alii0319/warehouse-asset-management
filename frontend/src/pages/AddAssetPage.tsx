import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAsset, useDashboardSummary } from '@/hooks/useAssets';
import { cn } from '@/lib/utils';
import { ApiError } from '@/services/api';
import type { Asset } from '@/types/asset';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_CATEGORIES = [
  'Forklift',
  'Pallet Jack',
  'Barcode Scanner',
  'Racking',
  'Conveyor',
  'Storage Bin',
];

const assetSchema = z.object({
  asset_id: z.string().trim().min(1, 'Asset ID is required.').max(100, 'Asset ID is too long.'),
  category: z.string().trim().min(1, 'Category is required.').max(100, 'Category is too long.'),
  external_reference: z.string().trim().max(255, 'External reference is too long.').optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export function AddAssetPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const summaryQuery = useDashboardSummary();
  const createMutation = useCreateAsset();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_id: '',
      category: '',
      external_reference: '',
    },
  });

  const suggestedCategories = useMemo(() => {
    const existing = summaryQuery.data?.categories ?? [];
    return Array.from(new Set([...existing, ...DEFAULT_CATEGORIES]));
  }, [summaryQuery.data?.categories]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File | undefined) => {
    setFileError(null);
    setSubmitError(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setFileError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File exceeds the 5 MB upload limit.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: AssetFormValues) => {
    setSubmitError(null);
    setCreatedAsset(null);

    if (!selectedFile) {
      setFileError('Please upload an asset photograph.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        asset_id: values.asset_id,
        category: values.category,
        photograph: selectedFile,
        external_reference: values.external_reference || undefined,
      });

      setCreatedAsset(created);
      reset();
      clearSelectedFile();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.asset_id?.[0]) {
          setError('asset_id', { message: err.fieldErrors.asset_id[0] });
        }
        if (err.fieldErrors.category?.[0]) {
          setError('category', { message: err.fieldErrors.category[0] });
        }
        if (err.fieldErrors.photograph?.[0]) {
          setFileError(err.fieldErrors.photograph[0]);
        }
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to save asset. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Add New Asset
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register a warehouse asset with its unique ID, category, and photograph.
          </p>
        </div>
      </div>

      {createdAsset && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">
                Asset {createdAsset.asset_id} saved successfully
              </p>
              <p className="text-xs text-emerald-700">
                Recorded on {createdAsset.created_date} at {createdAsset.created_time}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/assets/${createdAsset.id}`}>
              <Button variant="outline" size="sm" className="border-emerald-300 bg-white">
                View Record
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold">Could not register asset</p>
            <p className="mt-0.5 text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-slate-200">
          <CardTitle>Asset Information</CardTitle>
          <CardDescription>
            Creation date and time are automatically recorded by the server.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Asset ID */}
            <div className="space-y-2">
              <Label htmlFor="asset_id">
                Asset ID / Identification Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="asset_id"
                placeholder="e.g. AST-1001"
                autoComplete="off"
                {...register('asset_id')}
              />
              {errors.asset_id && (
                <p className="text-xs font-medium text-red-600">{errors.asset_id.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Asset Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                list="asset-categories-list"
                placeholder="Enter or select a category (e.g. Forklift)"
                autoComplete="off"
                {...register('category')}
              />
              <datalist id="asset-categories-list">
                {suggestedCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat, { shouldValidate: true })}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs font-medium text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Optional External Reference */}
            <div className="space-y-2">
              <Label htmlFor="external_reference">External Reference (Optional)</Label>
              <Input
                id="external_reference"
                placeholder="e.g. PO-2026-441 or RFID tag ID"
                autoComplete="off"
                {...register('external_reference')}
              />
              {errors.external_reference && (
                <p className="text-xs font-medium text-red-600">
                  {errors.external_reference.message}
                </p>
              )}
            </div>

            {/* Photograph Upload */}
            <div className="space-y-2">
              <Label htmlFor="photograph">
                Asset Photograph <span className="text-red-500">*</span>
              </Label>
              <input
                ref={fileInputRef}
                id="photograph"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {!previewUrl ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
                    isDragging
                      ? 'border-teal-600 bg-teal-50/70'
                      : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50',
                  )}
                >
                  <div className="rounded-full bg-white p-3 shadow-xs border border-slate-200 text-slate-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPEG, PNG, or WebP up to 5 MB
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img
                      src={previewUrl}
                      alt="Selected asset preview"
                      className="max-h-72 w-full object-contain bg-slate-100"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span className="truncate font-medium">
                      {selectedFile?.name} (
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''})
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={clearSelectedFile}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {fileError && <p className="text-xs font-medium text-red-600">{fileError}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Link to="/">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Asset...
                  </>
                ) : (
                  'Submit Asset'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
