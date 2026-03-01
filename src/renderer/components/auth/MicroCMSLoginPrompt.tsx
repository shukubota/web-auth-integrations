import React, { useState } from 'react';

interface MicroCMSLoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => Promise<boolean>;
}

const MicroCMSLoginPrompt: React.FC<MicroCMSLoginPromptProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenLogin = async () => {
    setIsOpening(true);

    try {
      const success = await onOpenLogin();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to open login:', error);
    } finally {
      setIsOpening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            microCMS ログイン
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              microCMSへのログインが必要です
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              microCMSの管理画面でログインして、操作を続行してください。
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">1.</span>
                <span>ブラウザウィンドウが開きます</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">2.</span>
                <span>microCMSアカウントでログインしてください</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">3.</span>
                <span>ログイン後、自動で操作が実行されます</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isOpening}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleOpenLogin}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isOpening}
            >
              {isOpening ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ブラウザを開いています...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  ログイン画面を開く
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>注意:</strong> microCMSアカウントが必要です</p>
            <p>• アカウントをお持ちでない場合は、先にmicroCMSでサインアップしてください</p>
            <p>• ログイン後、ブラウザウィンドウは自動的に操作されます</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicroCMSLoginPrompt;