import React from 'react';
import { AuthStatus } from '@shared/types';

interface LoginPageProps {
  onLogin: () => Promise<void>;
  authStatus: AuthStatus | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, authStatus }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Dual Service Integration Agent
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Service1とService2にログインしてください
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Service1 Login */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service1 認証</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="service1-url" className="block text-sm font-medium text-gray-700">
                    ベースURL
                  </label>
                  <input
                    id="service1-url"
                    name="service1-url"
                    type="url"
                    className="input-field mt-1"
                    placeholder="https://service1.example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="service1-username" className="block text-sm font-medium text-gray-700">
                    ユーザー名
                  </label>
                  <input
                    id="service1-username"
                    name="service1-username"
                    type="text"
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="service1-password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <input
                    id="service1-password"
                    name="service1-password"
                    type="password"
                    className="input-field mt-1"
                    required
                  />
                </div>
                {authStatus?.service1?.error && (
                  <p className="text-sm text-red-600">{authStatus.service1.error}</p>
                )}
              </div>
            </div>

            {/* Service2 Login */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service2 認証</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="service2-url" className="block text-sm font-medium text-gray-700">
                    ベースURL
                  </label>
                  <input
                    id="service2-url"
                    name="service2-url"
                    type="url"
                    className="input-field mt-1"
                    placeholder="https://service2.example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="service2-username" className="block text-sm font-medium text-gray-700">
                    ユーザー名
                  </label>
                  <input
                    id="service2-username"
                    name="service2-username"
                    type="text"
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="service2-password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <input
                    id="service2-password"
                    name="service2-password"
                    type="password"
                    className="input-field mt-1"
                    required
                  />
                </div>
                {authStatus?.service2?.error && (
                  <p className="text-sm text-red-600">{authStatus.service2.error}</p>
                )}
              </div>
            </div>

            <div>
              <button type="submit" className="btn-primary w-full">
                ログイン
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;