import React from 'react';
import { Chat } from '../components/features/contracts';
import { ChatHistorySidebar } from '../components/features/contracts/ChatSidebar';
import { useChat } from '../components/features/contracts/provider';

export const ChatPage: React.FC = () => {
  const { reset } = useChat();

  const handleNewChat = () => {
    reset();
  };

  return (
    <div className="flex w-full h-[calc(100vh-140px)] -m-6 overflow-hidden">
      {/* Local History Sidebar (Nested inside ChatPage) */}
      <ChatHistorySidebar onNewChat={handleNewChat} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-slate-950">
        {/* Animated Background Glow (Refined for nested view) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex-1 overflow-hidden relative">
          <Chat />
        </div>
      </div>
    </div>
  );
};