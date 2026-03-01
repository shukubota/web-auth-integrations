import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { AuthStatus } from '@shared/types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TODO: Replace with actual IPC call
      const status: AuthStatus = {
        service1: { connected: false },
        service2: { connected: false },
      };

      setAuthStatus(status);
      setIsAuthenticated(status.service1.connected && status.service2.connected);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    await checkAuthStatus();
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setAuthStatus(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリケーションを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} authStatus={authStatus} />;
  }

  return <Dashboard onLogout={handleLogout} authStatus={authStatus} />;
};

export default App;