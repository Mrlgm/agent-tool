import { useState } from 'react';
import { ImageUploader } from '../../components/ImageUploader';
import { CodePreview } from '../../components/CodePreview';
import { generateCode } from '../../services/generateApi';

export function GeneratePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleImageSelect = (url: string) => {
    setImageUrl(url);
    setMessage('图片已上传成功，请输入需求描述，然后点击生成代码');
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      setError('请先上传图片');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMessage('正在分析图片并生成代码，请稍候...');

    try {
      const result = await generateCode(imageUrl, description);

      if (result.status === 'completed') {
        setTaskId(result.taskId);
        setMessage('代码生成完成！您可以在右侧预览效果。');
      } else {
        setError(result.error || '生成失败');
        setMessage('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = () => {
    if (taskId) {
      setTaskId(null);
      setTimeout(() => setTaskId(taskId), 100);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-3 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">🎨 Image2Code</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传图片
              </label>
              <ImageUploader
                onImageSelect={handleImageSelect}
                onUploadError={(err) => setError(err)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                需求描述（可选）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述您想要的页面效果，如：登录页面、蓝色主题..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!imageUrl || isGenerating}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !imageUrl || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? '生成中...' : '开始生成代码'}
            </button>

            {message && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="w-2/3 flex flex-col">
          <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDevice('mobile')}
                className={`px-3 py-1 rounded ${
                  device === 'mobile'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📱 手机
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`px-3 py-1 rounded ${
                  device === 'tablet'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📱 平板
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`px-3 py-1 rounded ${
                  device === 'desktop'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🖥️ 桌面
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {taskId ? (
              <CodePreview
                taskId={taskId}
                device={device}
                onRefresh={handleRefresh}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <div>上传图片并生成代码后即可预览</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
