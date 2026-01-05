'use client';

import { MessageCircle, Plus, Search } from 'lucide-react';

// Mock 会话数据
const mockSessions = [
  {
    id: '1',
    title: '项目讨论',
    lastMessage: '关于新功能的需求分析',
    time: '10:30',
    unread: 2,
  },
  {
    id: '2',
    title: '技术分享',
    lastMessage: 'React 18 新特性介绍',
    time: '09:15',
    unread: 0,
  },
  {
    id: '3',
    title: '团队会议',
    lastMessage: '周会纪要和任务分配',
    time: '昨天',
    unread: 1,
  },
  {
    id: '4',
    title: '代码审查',
    lastMessage: 'PR #123 的反馈',
    time: '昨天',
    unread: 0,
  },
];

export function Sidebar() {
  return (
    <div className="w-70 bg-gray-900 text-white flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">FlowVerse</h1>
          <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会话..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors mb-1 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium truncate">
                      {session.title}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">
                      {session.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {session.lastMessage}
                  </p>
                </div>
                {session.unread > 0 && (
                  <div className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {session.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部用户信息 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">用户名称</p>
            <p className="text-xs text-gray-400">在线</p>
          </div>
        </div>
      </div>
    </div>
  );
}
