import React, { useState } from 'react';
import { AuthStatus, ChatMessage } from '@shared/types';

interface DashboardProps {
  onLogout: () => Promise<void>;
  authStatus: AuthStatus | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, authStatus }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // TODO: Replace with actual IPC call to AI agent
      await new Promise(resolve => setTimeout(resolve, 1000));

      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `指示を受け取りました: "${userMessage.content}"\n\nタスクプランを作成中...`,
        timestamp: new Date(),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Dual Service Integration Agent
          </h1>
          <button
            onClick={onLogout}
            className="btn-secondary"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Service Status Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">サービス状態</h2>

          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Service1</h3>
                <span className={`status-indicator ${
                  authStatus?.service1?.connected ? 'status-connected' : 'status-disconnected'
                }`}>
                  {authStatus?.service1?.connected ? '接続中' : '未接続'}
                </span>
              </div>
              {authStatus?.service1?.lastLogin && (
                <p className="text-sm text-gray-500 mt-2">
                  最終ログイン: {new Date(authStatus.service1.lastLogin).toLocaleString()}
                </p>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Service2</h3>
                <span className={`status-indicator ${
                  authStatus?.service2?.connected ? 'status-connected' : 'status-disconnected'
                }`}>
                  {authStatus?.service2?.connected ? '接続中' : '未接続'}
                </span>
              </div>
              {authStatus?.service2?.lastLogin && (
                <p className="text-sm text-gray-500 mt-2">
                  最終ログイン: {new Date(authStatus.service2.lastLogin).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>チャットで指示を入力してください</p>
                    <p className="text-sm mt-2">
                      例: "Service1で商品データを作成し、Service2でキャンペーンを設定して"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-primary-600 text-white'
                              : message.type === 'error'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                            <span>処理中...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="指示を入力してください..."
                    className="flex-1 resize-none input-field"
                    rows={2}
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="btn-primary self-end"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">実行状況</h2>
          <div className="text-center text-gray-500 py-8">
            <p>実行中のタスクはありません</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;