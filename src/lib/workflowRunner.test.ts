/**
 * 工作流执行引擎测试文件
 * 用于验证 executeWorkflow 函数的正确性
 */

import { executeWorkflow } from './workflowRunner';
import { Node, Edge } from 'reactflow';

// 创建测试用例：Start -> LLM -> End
function createTestWorkflow() {
  const nodes: any[] = [
    {
      id: 'start-1',
      type: 'start',
      data: { label: '用户输入' },
    },
    {
      id: 'llm-1',
      type: 'llm',
      data: {
        label: 'AI 助手',
        model: 'gpt-4o',
        systemPrompt: '你是一个友好的AI助手'
      },
    },
    {
      id: 'end-1',
      type: 'end',
      data: { label: '最终回复' },
    },
  ];

  const edges: Edge[] = [
    {
      id: 'e1',
      source: 'start-1',
      target: 'llm-1',
    },
    {
      id: 'e2',
      source: 'llm-1',
      target: 'end-1',
    },
  ];

  return { nodes, edges };
}

// 测试函数
export async function testWorkflowExecution() {
  console.log('🧪 开始测试工作流执行引擎...');

  try {
    const { nodes, edges } = createTestWorkflow();
    const userMessage = "你好，请介绍一下自己";

    console.log('📊 测试工作流结构:');
    console.log('Nodes:', nodes.map(n => `${n.id}(${n.type})`));
    console.log('Edges:', edges.map(e => `${e.source} -> ${e.target}`));
    console.log('User Message:', userMessage);

    const results = await executeWorkflow(nodes, edges, userMessage);

    console.log('\n✅ 执行结果:');
    results.forEach(result => {
      console.log(`节点 ${result.nodeId}: ${result.success ? '成功' : '失败'}`);
      if (result.success) {
        console.log(`  输出: ${result.output}`);
      } else {
        console.log(`  错误: ${result.error}`);
      }
    });

    // 检查最终结果
    const endResult = results.find(r => r.nodeId === 'end-1');
    if (endResult && endResult.success) {
      console.log('\n🎉 工作流执行成功！');
      console.log('最终输出:', endResult.output);
    } else {
      console.log('\n❌ 工作流执行失败');
    }

  } catch (error) {
    console.error('💥 测试失败:', error);
  }
}

// 开发环境下运行测试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 可以在这里调用测试函数进行调试
  // testWorkflowExecution();
}
