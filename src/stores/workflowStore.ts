import { create } from 'zustand';
import { Node, Edge, addEdge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';

export type NodeType = 'start' | 'llm' | 'end';

export interface WorkflowNode extends Node {
  type: NodeType;
  data: {
    label: string;
    model?: string;
    systemPrompt?: string;
  };
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  nodeIdCounter: number;

  // Actions
  addNode: (type: NodeType, position?: { x: number; y: number }) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 100 },
      data: { label: '用户输入' },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 500, y: 100 },
      data: { label: '最终回复' },
    },
  ],
  edges: [],
  nodeIdCounter: 2,

  addNode: (type: NodeType, position = { x: 250, y: 150 }) => {
    const { nodes, nodeIdCounter } = get();
    const newNodeId = `${type}-${nodeIdCounter + 1}`;

    let label = '';
    let data: WorkflowNode['data'] = { label: '' };

    switch (type) {
      case 'start':
        label = '用户输入';
        data = { label };
        break;
      case 'llm':
        label = 'LLM 调用';
        data = {
          label,
          model: 'gpt-4o',
          systemPrompt: '你是一个有帮助的AI助手。'
        };
        break;
      case 'end':
        label = '最终回复';
        data = { label };
        break;
    }

    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      position,
      data,
    };

    set({
      nodes: [...nodes, newNode],
      nodeIdCounter: nodeIdCounter + 1,
    });
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[],
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(connection, state.edges),
    }));
  },

  updateNodeData: (nodeId: string, newData: Partial<WorkflowNode['data']>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ),
    }));
  },

  removeNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
  },

  removeEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },
}));
