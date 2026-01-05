'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle } from 'lucide-react';
import { WorkflowNode } from '../../../stores/workflowStore';

export function EndNode({ data }: NodeProps<WorkflowNode['data']>) {
  return (
    <div className="bg-green-500 rounded-lg border-2 border-green-600 shadow-lg min-w-[200px]">
      {/* Header */}
      <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center space-x-2">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            工作流终点
          </p>
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-600 border-2 border-white dark:border-gray-800"
        style={{ left: -6 }}
      />
    </div>
  );
}
