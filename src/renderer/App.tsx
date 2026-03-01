import React from 'react';
import ChatInterface from './components/chat/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="h-screen bg-white dark:bg-gray-900">
      <ChatInterface />
    </div>
  );
};

export default App;