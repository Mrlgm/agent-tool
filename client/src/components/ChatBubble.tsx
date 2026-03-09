import type { Message as ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">调用工具:</div>
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="text-xs bg-gray-200 rounded px-2 py-1 mt-1">
                {tc.name}: {JSON.stringify(tc.arguments)}
              </div>
            ))}
          </div>
        )}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">工具结果:</div>
            {message.toolResults.map((tr) => (
              <div
                key={tr.toolCallId}
                className={`text-xs rounded px-2 py-1 mt-1 ${
                  tr.isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}
              >
                {tr.result}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs opacity-60 mt-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
