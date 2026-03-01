import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@shared/types';
import MicroCMSLoginPrompt from '../auth/MicroCMSLoginPrompt';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: 'こんにちは！microCMSの操作をお手伝いします。\n\n例：「microCMSでサービスを追加して」\n「microCMSでブログAPIを作成して」\n「microCMSでメディアをアップロードして」',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [microCMSStatus, setMicroCMSStatus] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check microCMS status on component mount and periodically
    const checkStatus = async () => {
      try {
        const status = await window.electronAPI.microCMS.getStatus();
        setMicroCMSStatus(status);
      } catch (error) {
        console.error('Failed to check microCMS status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await window.electronAPI.microCMS.login(email, password);
      if (result.success) {
        // Update status
        const status = await window.electronAPI.microCMS.getStatus();
        setMicroCMSStatus(status);

        // Execute pending command if there is one
        if (status.connected && pendingCommand) {
          await processSingleMessage(pendingCommand);
          setPendingCommand(null);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const processSingleMessage = async (message: string) => {
    setIsProcessing(true);

    try {
      const response = await window.electronAPI.sendMessage(message);

      const agentResponse: ChatMessage = {
        id: response.id || (Date.now() + 1).toString(),
        type: response.type || 'agent',
        content: response.content,
        timestamp: new Date(response.timestamp) || new Date(),
        metadata: response.metadata,
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessageWithAuth = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await window.electronAPI.sendMessage(message);

      // Check if response requires authentication
      if (response.requiresAuth || response.error?.includes('Not authenticated')) {
        setPendingCommand(message);
        setShowLoginPrompt(true);
        setIsProcessing(false);
        return;
      }

      const agentResponse: ChatMessage = {
        id: response.id || (Date.now() + 1).toString(),
        type: response.type || 'agent',
        content: response.content,
        timestamp: new Date(response.timestamp) || new Date(),
        metadata: response.metadata,
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (error: any) {
      // Check if error is related to authentication
      if (error?.message?.includes('Not authenticated') || error?.message?.includes('認証')) {
        setPendingCommand(message);
        setShowLoginPrompt(true);
        setIsProcessing(false);
        return;
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessageWithAuth(message);
  };

  const handleQuickCommand = async (command: string) => {
    await sendMessageWithAuth(command);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              microCMS Agent
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              microCMSを自然言語で操作
            </p>
          </div>

          <div className="flex-1 p-4">
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                クイックコマンド
              </div>
              <button
                onClick={() => handleQuickCommand('microCMSでサービスを追加して')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                disabled={isProcessing}
              >
                サービスを追加
              </button>
              <button
                onClick={() => handleQuickCommand('microCMSでブログAPIを作成して')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                disabled={isProcessing}
              >
                ブログAPIを作成
              </button>
              <button
                onClick={() => handleQuickCommand('microCMSでメディアをアップロードして')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                disabled={isProcessing}
              >
                メディアをアップロード
              </button>
              <button
                onClick={() => handleQuickCommand('microCMSでコンテンツを作成して')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                disabled={isProcessing}
              >
                コンテンツを作成
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                microCMSStatus?.connected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <div className="flex-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {microCMSStatus?.connected
                    ? `microCMS接続中 (${microCMSStatus.serviceId})`
                    : 'microCMS未接続'
                  }
                </span>
                {microCMSStatus?.lastVerified && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    最終確認: {new Date(microCMSStatus.lastVerified).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">microCMS Agent</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">AIによるmicroCMS操作支援</p>
          </div>

          <div className="w-9"></div> {/* Spacer */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-3xl`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-4' : 'mr-4'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      message.type === 'user'
                        ? 'bg-primary-500 text-white'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.type === 'user' ? 'U' : message.type === 'error' ? '!' : 'AI'}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary-500 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs mt-2 text-gray-500 dark:text-gray-400 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex flex-row max-w-3xl">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      AI
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">microCMSを操作中...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="microCMSで何をしたいかを入力してください..."
                  className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  disabled={isProcessing}
                />
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Enter で送信、Shift + Enter で改行
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {inputMessage.length}/2000
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="self-end px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <MicroCMSLoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => {
          setShowLoginPrompt(false);
          setPendingCommand(null);
        }}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default ChatInterface;