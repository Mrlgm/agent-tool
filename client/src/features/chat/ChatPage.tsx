import { useCallback } from 'react';
import type { Message } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { sendChatMessage } from '../../services/api';
import { MessageList } from './MessageList';
import { InputArea } from '../../components/InputArea';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatPage() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore();

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setLoading(true);

    try {
      const allMessages = [...messages, userMessage];
      const response = await sendChatMessage({ messages: allMessages });
      addMessage(response.message);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `错误: ${(error as Error).message}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [messages, addMessage, setLoading]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-3 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">🤖 Agent 助手</h1>
      </header>
      <MessageList messages={messages} isLoading={isLoading} />
      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
