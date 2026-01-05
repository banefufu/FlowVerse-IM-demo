'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { MessageCircle } from 'lucide-react';
import { WorkflowNode } from '../../../stores/workflowStore';

export function StartNode({ data }: NodeProps<WorkflowNode['data']>) {
  return (
    <div className="bg-blue-500 rounded-lg border-2 border-blue-600 shadow-lg min-w-[200px]">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center space-x-2">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            工作流起点
          </p>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-600 border-2 border-white dark:border-gray-800"
        style={{ right: -6 }}
      />
    </div>
  );
}
