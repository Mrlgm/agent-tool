import { useState, useEffect, useRef } from 'react';

interface CodePreviewProps {
  taskId: string | null;
  device: 'mobile' | 'tablet' | 'desktop';
  onRefresh?: () => void;
}

const DEVICE_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: '100%',
};

export function CodePreview({ taskId, device, onRefresh }: CodePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        setLoading(false);
      };
      iframe.onerror = () => {
        setError('加载失败');
        setLoading(false);
      };
      iframe.src = `/api/preview/${taskId}?t=${Date.now()}`;
    }
  }, [taskId]);

  const width = DEVICE_WIDTHS[device];

  return (
    <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
      <div className="bg-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {device === 'mobile' && '📱 移动端'}
            {device === 'tablet' && '�板 平板'}
            {device === 'desktop' && '🖥️ 桌面端'}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            刷新
          </button>
        )}
      </div>

      <div className="p-4 flex justify-center">
        <div
          className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{ width: typeof width === 'number' ? `${width}px` : width, minHeight: '500px' }}
        >
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[500px]">
              <div className="text-gray-400">加载中...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full min-h-[500px]">
              <div className="text-red-500">{error}</div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            className={`w-full ${loading || error ? 'hidden' : ''}`}
            style={{ height: '500px' }}
            title="preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
