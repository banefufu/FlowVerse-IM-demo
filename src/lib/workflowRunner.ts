import { Node, Edge } from 'reactflow';

// 定义节点类型和执行上下文
interface WorkflowNode extends Node {
  type: 'start' | 'llm' | 'end';
  data: {
    label: string;
    model?: string;
    systemPrompt?: string;
  };
}

interface NodeResult {
  nodeId: string;
  output: string;
  success: boolean;
  error?: string;
}

interface ExecutionContext {
  nodeResults: Map<string, NodeResult>;
  userMessage: string;
  reverseAdjacencyList: Map<string, string[]>; // 用于查找前置节点
}

/**
 * OpenAI API 调用
 * 支持真实 API 调用和模拟模式
 */
async function callOpenAI(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  // 获取环境变量
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  // 如果没有配置 API key，使用模拟模式
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.log('🔄 使用模拟模式 (未配置 OPENAI_API_KEY)');
    console.log('💡 提示: 在项目根目录创建 .env.local 文件并设置 OPENAI_API_KEY 来启用真实 AI 对话');
    return simulateOpenAICall(model, systemPrompt, userPrompt);
  }

  try {
    console.log('🤖 调用真实 OpenAI API...');

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我无法生成回复。';
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    // 发生错误时回退到模拟模式
    console.log('🔄 回退到模拟模式');
    return simulateOpenAICall(model, systemPrompt, userPrompt);
  }
}

/**
 * 模拟 OpenAI API 调用（备用模式）
 */
async function simulateOpenAICall(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 模拟 AI 回复
  const responses = [
    `基于 ${model} 模型的回复：${systemPrompt ? '使用了系统提示词，' : ''}处理用户输入 "${userPrompt}"`,
    `AI 思考中... 根据系统指令 "${systemPrompt}" 为用户查询 "${userPrompt}" 生成回复`,
    `${model} 分析：用户想要 "${userPrompt}"，结合系统提示 "${systemPrompt}" 给出专业回答`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * 获取节点的前置节点输出
 * 在工作流执行中，每个节点可能有多个前置节点
 * 我们需要决定如何组合这些输出
 */
function getPredecessorOutputs(nodeId: string, context: ExecutionContext): string[] {
  const predecessorIds = context.reverseAdjacencyList.get(nodeId) || [];
  const predecessorResults: string[] = [];

  predecessorIds.forEach(predId => {
    const result = context.nodeResults.get(predId);
    if (result && result.success) {
      predecessorResults.push(result.output);
    }
  });

  return predecessorResults;
}

/**
 * 执行单个节点
 *
 * 节点执行逻辑：
 * - StartNode: 直接输出用户消息
 * - LLMNode: 接收前置节点的输出作为输入，调用 AI 接口
 * - EndNode: 汇总所有前置节点的输出作为最终结果
 */
async function executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult> {
  try {
    switch (node.type) {
      case 'start':
        // StartNode 是工作流的入口，输出用户输入的消息
        return {
          nodeId: node.id,
          output: context.userMessage,
          success: true,
        };

      case 'llm':
        // LLMNode 处理逻辑：
        // 1. 获取所有前置节点的输出
        // 2. 如果有前置输出，使用最后一个作为输入；否则使用用户原始消息
        // 3. 调用 AI 接口进行处理
        const predecessorOutputs = getPredecessorOutputs(node.id, context);
        const inputForAI = predecessorOutputs.length > 0
          ? predecessorOutputs[predecessorOutputs.length - 1] // 使用最近的前置输出
          : context.userMessage;

        // 调用 AI 接口
        const aiResponse = await callOpenAI(
          node.data.model || 'gpt-4o',
          node.data.systemPrompt || '你是一个有帮助的AI助手。',
          inputForAI
        );

        return {
          nodeId: node.id,
          output: aiResponse,
          success: true,
        };

      case 'end':
        // EndNode 处理逻辑：
        // 1. 收集所有前置节点的输出
        // 2. 将它们组合成最终结果
        const endPredecessorOutputs = getPredecessorOutputs(node.id, context);

        const finalOutput = endPredecessorOutputs.length > 0
          ? endPredecessorOutputs.join('\n\n') // 多输出用换行分隔
          : '工作流执行完成，但没有输出结果';

        return {
          nodeId: node.id,
          output: finalOutput,
          success: true,
        };

      default:
        throw new Error(`未知的节点类型: ${node.type}`);
    }
  } catch (error) {
    return {
      nodeId: node.id,
      output: '',
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 构建邻接表和反向邻接表
 * 邻接表：记录每个节点指向哪些节点 (用于执行顺序)
 * 反向邻接表：记录每个节点被哪些节点指向 (用于计算入度)
 */
function buildAdjacencyLists(edges: Edge[]) {
  const adjacencyList = new Map<string, string[]>(); // nodeId -> [targetNodeIds]
  const reverseAdjacencyList = new Map<string, string[]>(); // nodeId -> [sourceNodeIds]

  edges.forEach(edge => {
    // 正向邻接表：source -> targets
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);

    // 反向邻接表：target -> sources
    if (!reverseAdjacencyList.has(edge.target)) {
      reverseAdjacencyList.set(edge.target, []);
    }
    reverseAdjacencyList.get(edge.target)!.push(edge.source);
  });

  return { adjacencyList, reverseAdjacencyList };
}

/**
 * 计算节点的入度（有多少个前置节点指向它）
 * 入度为0的节点可以直接执行
 */
function calculateIndegrees(nodes: WorkflowNode[], reverseAdjacencyList: Map<string, string[]>): Map<string, number> {
  const indegrees = new Map<string, number>();

  // 初始化所有节点的入度为0
  nodes.forEach(node => {
    indegrees.set(node.id, 0);
  });

  // 计算实际入度
  reverseAdjacencyList.forEach((sources, targetId) => {
    indegrees.set(targetId, sources.length);
  });

  return indegrees;
}

/**
 * 执行工作流的核心函数
 *
 * 核心算法：拓扑排序 (Topological Sort) + 工作流执行引擎
 *
 * 为什么使用拓扑排序？
 * - 工作流节点间存在依赖关系（通过 edges 连接）
 * - 必须确保前置节点执行完成后，才能执行依赖它的节点
 * - 拓扑排序能保证依赖关系的正确执行顺序
 *
 * 算法步骤详解：
 * 1. 构建邻接表和反向邻接表
 *    - 邻接表：记录每个节点指向哪些节点 (outgoing edges)
 *    - 反向邻接表：记录每个节点被哪些节点指向 (incoming edges)
 *
 * 2. 计算入度 (Indegree)
 *    - 入度 = 指向该节点的边数
 *    - 入度为0的节点：没有前置依赖，可以直接执行
 *
 * 3. 拓扑排序执行：
 *    - 使用队列存储入度为0的节点
 *    - 执行节点后，减少其邻居节点的入度
 *    - 当邻居入度变为0时，加入队列等待执行
 *    - 重复直到所有节点执行完毕
 *
 * 4. 错误检测：
 *    - 如果初始队列为空但图不空 → 存在环
 *    - 如果执行节点数 < 总节点数 → 图不连通
 *
 * 5. 节点执行：
 *    - StartNode: 输出用户消息
 *    - LLMNode: 调用AI接口，输入前置节点输出
 *    - EndNode: 汇总所有结果
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: Edge[],
  userMessage: string
): Promise<NodeResult[]> {
  // 1. 构建邻接表
  const { adjacencyList, reverseAdjacencyList } = buildAdjacencyLists(edges);

  // 2. 计算入度
  const indegrees = calculateIndegrees(nodes, reverseAdjacencyList);

  // 3. 初始化执行上下文
  const context: ExecutionContext = {
    nodeResults: new Map(),
    userMessage,
    reverseAdjacencyList,
  };

  // 4. 使用拓扑排序执行节点
  const executionOrder: WorkflowNode[] = [];
  const queue: string[] = [];
  const remainingIndegrees = new Map(indegrees);

  // 找到所有入度为0的节点（无依赖节点）
  nodes.forEach(node => {
    if (remainingIndegrees.get(node.id) === 0) {
      queue.push(node.id);
    }
  });

  // 如果没有入度为0的节点，且图不为空，则存在环
  if (queue.length === 0 && nodes.length > 0) {
    throw new Error('工作流图存在环，无法执行');
  }

  // 执行拓扑排序
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    const currentNode = nodes.find(n => n.id === currentNodeId);

    if (!currentNode) continue;

    // 执行当前节点
    const result = await executeNode(currentNode, context);
    context.nodeResults.set(currentNodeId, result);
    executionOrder.push(currentNode);

    // 减少后续节点的入度
    const neighbors = adjacencyList.get(currentNodeId) || [];
    neighbors.forEach(neighborId => {
      const currentIndegree = remainingIndegrees.get(neighborId)!;
      remainingIndegrees.set(neighborId, currentIndegree - 1);

      // 如果入度变为0，加入执行队列
      if (remainingIndegrees.get(neighborId) === 0) {
        queue.push(neighborId);
      }
    });
  }

  // 5. 检查是否所有节点都被执行（图是否连通）
  if (executionOrder.length !== nodes.length) {
    throw new Error('工作流图不连通，存在无法到达的节点');
  }

  // 6. 返回所有节点的执行结果
  return Array.from(context.nodeResults.values());
}

/**
 * 使用示例：
 *
 * ```typescript
 * import { executeWorkflow } from './lib/workflowRunner';
 * import { useWorkflowStore } from './stores/workflowStore';
 *
 * const { nodes, edges } = useWorkflowStore.getState();
 * const userMessage = "请帮我分析一下React的优势";
 *
 * try {
 *   const results = await executeWorkflow(nodes, edges, userMessage);
 *   console.log('执行结果:', results);
 *
 *   // 找到EndNode的结果
 *   const endResult = results.find(r => r.nodeId.startsWith('end-'));
 *   if (endResult) {
 *     console.log('最终输出:', endResult.output);
 *   }
 * } catch (error) {
 *   console.error('工作流执行失败:', error);
 * }
 * ```
 */
