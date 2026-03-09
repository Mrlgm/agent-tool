import { useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { ChatBubble } from '../../components/ChatBubble';
import { Loading } from '../../components/Loading';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-20">
          <div className="text-lg mb-2">👋 你好！</div>
          <div>我是你的 Agent 助手，可以帮你搜索信息、计算时间等</div>
        </div>
      )}
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      {isLoading && <Loading />}
      <div ref={bottomRef} />
    </div>
  );
}
