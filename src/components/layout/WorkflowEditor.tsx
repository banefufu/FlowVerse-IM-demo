'use client';

import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings, Zap, Workflow, Brain, Play } from 'lucide-react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore, NodeType } from '../../stores/workflowStore';
import { StartNode, LLMNode, EndNode } from '../workflow/nodes';
import { executeWorkflow } from '../../lib/workflowRunner';

const nodeTypes = {
  start: StartNode,
  llm: LLMNode,
  end: EndNode,
};

interface WorkflowEditorProps {
  isVisible: boolean;
  onToggle: () => void;
}

function WorkflowEditorContent({ isVisible, onToggle }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const {
    nodes,
    edges,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useWorkflowStore();

  const [localNodes, setLocalNodes, onLocalNodesChange] = useNodesState(nodes);
  const [localEdges, setLocalEdges, onLocalEdgesChange] = useEdgesState(edges);

  // Sync store changes to local state
  React.useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes, setLocalNodes]);

  React.useEffect(() => {
    setLocalEdges(edges);
  }, [edges, setLocalEdges]);

  const onConnectLocal = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, localEdges);
      setLocalEdges(newEdges);
      onConnect(params);
    },
    [localEdges, setLocalEdges, onConnect]
  );

  const handleAddNode = (type: NodeType) => {
    if (reactFlowInstance) {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: bounds.width / 2,
          y: bounds.height / 2,
        });
        addNode(type, position);
      } else {
        addNode(type);
      }
    } else {
      addNode(type);
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionError(null);

    try {
      // 使用默认的用户消息进行测试
      const userMessage = "请帮我分析一下React的优势和特点";
      const results = await executeWorkflow(nodes, edges, userMessage);

      console.log('工作流执行结果:', results);

      // 找到EndNode的结果
      const endResult = results.find(r => r.nodeId.startsWith('end-'));
      if (endResult) {
        if (endResult.success) {
          setExecutionResult(endResult.output);
        } else {
          setExecutionError(endResult.error || '执行失败');
        }
      } else {
        setExecutionError('未找到结束节点的结果');
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="w-12 bg-gray-900 text-white flex flex-col items-center py-4 border-l border-gray-700">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="展开工作流编辑器"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-100 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 头部 */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            工作流编排
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="折叠工作流编辑器"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ReactFlow 画布区域 */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={(changes) => {
            onLocalNodesChange(changes);
            onNodesChange(changes);
          }}
          onEdgesChange={(changes) => {
            onLocalEdgesChange(changes);
            onEdgesChange(changes);
          }}
          onConnect={onConnectLocal}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50 dark:bg-gray-900"
        >
          <Controls
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            showZoom
            showFitView
            showInteractive={false}
          />
          <MiniMap
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'start':
                  return '#3b82f6';
                case 'llm':
                  return '#8b5cf6';
                case 'end':
                  return '#10b981';
                default:
                  return '#6b7280';
              }
            }}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
            className="dark:opacity-20"
          />

          {/* 添加节点面板 */}
          <Panel position="top-right" className="space-y-2">
            <button
              onClick={() => handleAddNode('llm')}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>添加 LLM 节点</span>
            </button>
            <button
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span>{isExecuting ? '执行中...' : '执行工作流'}</span>
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* 执行结果显示区域 */}
      {(executionResult || executionError) && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-h-32 overflow-y-auto">
            {executionError ? (
              <div className="text-red-600 dark:text-red-400 text-sm">
                <strong>执行错误:</strong> {executionError}
              </div>
            ) : (
              <div className="text-green-600 dark:text-green-400 text-sm">
                <strong>执行结果:</strong>
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border text-gray-900 dark:text-gray-100">
                  {executionResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部工具栏 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleAddNode('llm')}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Brain className="w-4 h-4" />
            <span>LLM</span>
          </button>
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isExecuting ? '执行中...' : '执行'}</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function WorkflowEditor({ isVisible, onToggle }: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent isVisible={isVisible} onToggle={onToggle} />
    </ReactFlowProvider>
  );
}
