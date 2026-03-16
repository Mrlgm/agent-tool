import { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string, file: File) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export function ImageUploader({
  onImageSelect,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        onUploadError?.('请上传图片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onUploadError?.('图片大小不能超过5MB');
        return;
      }

      const localPreview = await fileToBase64(file);
      setPreview(localPreview);

      setIsUploading(true);
      onUploadStart?.();

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: localPreview }),
        });

        const data = await response.json();

        if (data.success) {
          onImageSelect(data.url, file);
          onUploadComplete?.(data.url);
        } else {
          onUploadError?.(data.error || '上传失败');
        }
      } catch (error) {
        onUploadError?.('网络错误，请重试');
      } finally {
        setIsUploading(false);
      }
    },
    [onImageSelect, onUploadStart, onUploadComplete, onUploadError]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFile(file);
        }
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled || isUploading}
        className="hidden"
        id="image-upload"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 mx-auto rounded-lg"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white">上传中...</div>
            </div>
          )}
        </div>
      ) : (
        <label htmlFor="image-upload" className="block">
          <div className="text-4xl mb-2">📁</div>
          <div className="text-gray-600 mb-1">
            点击或拖拽上传图片
          </div>
          <div className="text-xs text-gray-400">
            支持 PNG, JPG, WebP, GIF（最大5MB）
          </div>
          <div className="text-xs text-gray-400 mt-1">
            也可 Ctrl+V 粘贴图片
          </div>
        </label>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
