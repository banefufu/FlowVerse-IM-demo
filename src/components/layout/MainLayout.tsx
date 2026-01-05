'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { WorkflowEditor } from './WorkflowEditor';

export function MainLayout() {
  const [isWorkflowVisible, setIsWorkflowVisible] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'configured' | 'mock'>('checking');

  useEffect(() => {
    // 检查 API 配置状态
    const checkApiStatus = () => {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
                     (typeof window !== 'undefined' && (window as any).OPENAI_API_KEY);

      if (apiKey && apiKey !== 'your_openai_api_key_here') {
        setApiStatus('configured');
      } else {
        setApiStatus('mock');
      }
    };

    checkApiStatus();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* API 状态指示器 */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          apiStatus === 'configured'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : apiStatus === 'mock'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}>
          {apiStatus === 'configured' ? '🤖 真实 API' :
           apiStatus === 'mock' ? '🎭 模拟模式' :
           '🔄 检查中...'}
        </div>
      </div>

      {/* 左侧边栏 */}
      <Sidebar />

      {/* 中间聊天区域 */}
      <ChatArea />

      {/* 右侧工作流编辑器 */}
      <WorkflowEditor
        isVisible={isWorkflowVisible}
        onToggle={() => setIsWorkflowVisible(!isWorkflowVisible)}
      />
    </div>
  );
}
