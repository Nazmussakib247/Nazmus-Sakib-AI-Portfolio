import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2, FileText, ImagePlus } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { labelCls } from './adminUi';

/* ---------- helpers ---------- */

/** Downscale + compress an image in the browser before upload. */
async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<{ dataBase64: string; mimeType: string }> {
  // GIFs and SVGs pass through untouched (canvas would break animation/vector)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { dataBase64: await toBase64(file), mimeType: file.type };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, width, height);

    // PNG keeps transparency; everything else becomes JPEG
    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    return { dataBase64: dataUrl.split(',')[1], mimeType };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_UPLOAD_MB = 9;

function useUploader() {
  const upload = trpc.uploadAdmin.upload.useMutation();

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      let dataBase64: string;
      let mimeType: string;

      if (file.type.startsWith('image/')) {
        ({ dataBase64, mimeType } = await compressImage(file));
      } else if (file.type === 'application/pdf') {
        dataBase64 = await toBase64(file);
        mimeType = file.type;
      } else {
        toast.error('Only images and PDFs are supported');
        return null;
      }

      if (dataBase64.length * 0.75 > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`File is too large (max ${MAX_UPLOAD_MB}MB)`);
        return null;
      }

      const result = await upload.mutateAsync({ filename: file.name, mimeType, dataBase64 });
      return result.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  };

  return { uploadFile, isUploading: upload.isPending };
}

/* ---------- single image field ---------- */

export function ImageUploadField({
  label,
  value,
  onChange,
  accept = 'image/*',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploadFile, isUploading } = useUploader();
  const isPdf = value.toLowerCase().endsWith('.pdf') || accept.includes('pdf');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      onChange(url);
      toast.success('Uploaded');
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#05060f] p-2">
          {value.toLowerCase().includes('.pdf') || !value.match(/^(\/api\/files\/|http|\/)/) ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white/5">
              <FileText className="h-5 w-5 text-gray-400" />
            </span>
          ) : (
            <img src={value} alt="preview" className="h-14 w-14 rounded-md object-cover" />
          )}
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-400">{value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-gray-500 transition-colors hover:text-red-400"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          disabled={isUploading}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-5 text-sm transition-colors ${
            dragging
              ? 'border-[#e8b923] bg-[#e8b923]/5 text-[#e8b923]'
              : 'border-white/15 text-gray-400 hover:border-[#e8b923]/50 hover:text-[#e8b923]'
          }`}
        >
          {isUploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="h-4 w-4" /> {isPdf ? 'Click or drop a file here' : 'Click or drop an image here'}</>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}

/* ---------- multi image field (screenshots) ---------- */

export function MultiImageUploadField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUploader();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = [...values];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) next.push(url);
    }
    onChange(next);
    toast.success('Uploaded');
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative">
            <img src={url} alt={`screenshot ${i + 1}`} className="h-16 w-24 rounded-md border border-white/10 object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute -top-1.5 -right-1.5 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
              aria-label="Remove screenshot"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-white/15 text-gray-500 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
