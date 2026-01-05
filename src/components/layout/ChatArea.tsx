'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useChatStore, ChatMessage } from '../../stores/chatStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { executeWorkflow } from '../../lib/workflowRunner';

export function ChatArea() {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    addMessage,
    updateMessage,
    updateMessageContent,
    setTyping,
    isTyping,
  } = useChatStore();

  const { nodes, edges } = useWorkflowStore();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // 流式输出函数
  const streamText = async (messageId: string, fullText: string, delay: number = 50) => {
    let currentIndex = 0;
    const textLength = fullText.length;

    return new Promise<void>((resolve) => {
      typingIntervalRef.current = setInterval(() => {
        currentIndex++;
        const currentText = fullText.substring(0, currentIndex);
        updateMessageContent(messageId, currentText);

        if (currentIndex >= textLength) {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setTyping(false);
          updateMessage(messageId, { status: 'completed' });
          resolve();
        }
      }, delay);
    });
  };

  // 发送消息处理函数
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      // 1. 添加用户消息
      addMessage('user', userMessage, 'sent');

      // 2. 添加 AI 思考中的消息
      const aiMessageId = addMessage('assistant', '思考中...', 'thinking');
      setTyping(true);

      // 3. 执行工作流
      const results = await executeWorkflow(nodes, edges, userMessage);

      // 4. 找到最终结果
      const endResult = results.find(r => r.nodeId.startsWith('end-'));

      let finalContent = '';
      if (endResult?.success) {
        finalContent = endResult.output;
      } else {
        finalContent = endResult?.error || '抱歉，处理您的请求时出现错误。';
        updateMessage(aiMessageId, { status: 'error' });
      }

      // 5. 流式输出结果
      await streamText(aiMessageId, finalContent);

    } catch (error) {
      console.error('发送消息失败:', error);

      // 添加错误消息
      const errorMessage = error instanceof Error
        ? `处理失败: ${error.message}`
        : '抱歉，处理您的请求时出现未知错误。';

      const errorMessageId = addMessage('assistant', errorMessage, 'error');
      setTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化时间显示
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染消息状态指示器
  const renderMessageStatus = (message: ChatMessage) => {
    switch (message.status) {
      case 'thinking':
        return (
          <div className="flex items-center space-x-1 mt-1">
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              思考中...
            </span>
          </div>
        );
      case 'completed':
        return (
          <span className="text-xs mt-1 block text-gray-500 dark:text-gray-400">
            {formatTime(message.timestamp)}
          </span>
        );
      case 'error':
        return (
          <span className="text-xs mt-1 block text-red-500 dark:text-red-400">
            发送失败
          </span>
        );
      default:
        return (
          <span className="text-xs mt-1 block text-gray-500 dark:text-gray-400">
            {formatTime(message.timestamp)}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* 聊天头部 */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 助手
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              在线 • 工作流驱动
            </p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smile className="w-8 h-8" />
            </div>
            <p>开始与 AI 助手对话吧！</p>
            <p className="text-sm mt-2">右侧的工作流配置将决定 AI 的响应方式</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {renderMessageStatus(message)}
              </div>
            </div>
          ))
        )}

        {/* 打字指示器 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框区域 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-2">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[20px] max-h-32"
                rows={1}
                disabled={isSending}
              />
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
              使用右侧工作流配置来驱动 AI 响应
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
