'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { WorkflowNode } from '../../../stores/workflowStore';
import { useWorkflowStore } from '../../../stores/workflowStore';

const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-3.5', label: 'Claude-3.5' },
];

export function LLMNode({ id, data }: NodeProps<WorkflowNode['data']>) {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const handleModelChange = (model: string) => {
    updateNodeData(id, { model });
    setIsModelOpen(false);
  };

  const handlePromptChange = (systemPrompt: string) => {
    updateNodeData(id, { systemPrompt });
  };

  return (
    <div className="bg-purple-500 rounded-lg border-2 border-purple-600 shadow-lg min-w-[280px]">
      {/* Header */}
      <div className="bg-purple-600 text-white p-3 rounded-t-lg flex items-center space-x-2">
        <Brain className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg space-y-3">
        {/* Model Selection */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            模型选择
          </label>
          <div className="relative">
            <button
              onClick={() => setIsModelOpen(!isModelOpen)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm">
                {MODELS.find(m => m.value === data.model)?.label || '选择模型'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isModelOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
                {MODELS.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => handleModelChange(model.value)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-md last:rounded-b-md"
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <button
            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
            className="w-full text-left text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            System Prompt {isPromptExpanded ? '▼' : '▶'}
          </button>

          {isPromptExpanded && (
            <textarea
              value={data.systemPrompt || ''}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="输入系统提示词..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center pt-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-600 border-2 border-white dark:border-gray-800"
        style={{ left: -6 }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-600 border-2 border-white dark:border-gray-800"
        style={{ right: -6 }}
      />
    </div>
  );
}
