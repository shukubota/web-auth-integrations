import React, { useState } from 'react';

interface MicroCMSAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (serviceId: string, apiKey: string) => Promise<boolean>;
}

const MicroCMSAuthDialog: React.FC<MicroCMSAuthDialogProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
}) => {
  const [serviceId, setServiceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceId || !apiKey) {
      setError('サービスIDとAPIキーの両方を入力してください。');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const success = await onAuthenticate(serviceId, apiKey);
      if (success) {
        setServiceId('');
        setApiKey('');
        onClose();
      } else {
        setError('認証に失敗しました。サービスIDとAPIキーを確認してください。');
      }
    } catch (error) {
      setError('認証中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCancel = () => {
    setServiceId('');
    setApiKey('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            microCMS 認証
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              サービスID
            </label>
            <input
              id="serviceId"
              type="text"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="your-service (https://your-service.microcms.io)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isAuthenticating}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              microCMSの管理画面URLからサービス名を入力してください
            </p>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              APIキー
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isAuthenticating}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              microCMSの「API設定」から取得したAPIキーを入力してください
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isAuthenticating}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAuthenticating || !serviceId || !apiKey}
            >
              {isAuthenticating ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  認証中...
                </div>
              ) : (
                '接続'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>サービスID取得方法:</strong></p>
            <p>1. https://app.microcms.io/ にログイン</p>
            <p>2. URLの「https://<strong>your-service</strong>.microcms.io」から取得</p>
            <br />
            <p><strong>APIキー取得方法:</strong></p>
            <p>1. microCMS管理画面の「設定」→「API設定」</p>
            <p>2. 「新しいAPIキーを作成」でキーを生成</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicroCMSAuthDialog;