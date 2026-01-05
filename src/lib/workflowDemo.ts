/**
 * 工作流执行引擎演示文件
 * 展示如何在实际应用中使用 executeWorkflow 函数
 */

import { executeWorkflow } from './workflowRunner';
import { useWorkflowStore } from '../stores/workflowStore';

/**
 * 演示：执行当前的工作流
 */
export async function demoExecuteCurrentWorkflow() {
  console.log('🚀 开始执行当前工作流...');

  try {
    // 获取当前工作流状态
    const { nodes, edges } = useWorkflowStore.getState();

    if (nodes.length === 0) {
      console.log('⚠️ 工作流为空，请先添加一些节点');
      return;
    }

    console.log(`📊 工作流包含 ${nodes.length} 个节点，${edges.length} 条连接`);

    // 使用演示消息执行工作流
    const userMessage = "请解释一下什么是机器学习，以及它在现代科技中的应用";
    console.log(`💬 用户输入: "${userMessage}"`);

    const results = await executeWorkflow(nodes, edges, userMessage);

    console.log('\n📋 执行结果详情:');
    results.forEach((result, index) => {
      const node = nodes.find(n => n.id === result.nodeId);
      console.log(`${index + 1}. ${node?.data.label} (${result.nodeId}):`);
      console.log(`   状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   输出: ${result.output.substring(0, 100)}${result.output.length > 100 ? '...' : ''}`);
      } else {
        console.log(`   错误: ${result.error}`);
      }
      console.log('');
    });

    // 提取最终结果
    const endResult = results.find(r => r.nodeId.startsWith('end-'));
    if (endResult?.success) {
      console.log('🎉 工作流执行成功！');
      console.log('📝 最终输出:');
      console.log(endResult.output);
    } else {
      console.log('❌ 工作流执行失败');
      if (endResult?.error) {
        console.log('错误信息:', endResult.error);
      }
    }

  } catch (error) {
    console.error('💥 执行过程中发生错误:', error);
  }
}

/**
 * 演示：创建并执行一个简单的线性工作流
 */
export async function demoSimpleLinearWorkflow() {
  console.log('🔗 创建简单的线性工作流 (Start -> LLM -> End)...');

  try {
    // 重置工作流
    useWorkflowStore.getState().nodes.splice(0);
    useWorkflowStore.getState().edges.splice(0);
    useWorkflowStore.getState().nodeIdCounter = 0;

    // 添加节点
    useWorkflowStore.getState().addNode('start', { x: 100, y: 100 });
    useWorkflowStore.getState().addNode('llm', { x: 300, y: 100 });
    useWorkflowStore.getState().addNode('end', { x: 500, y: 100 });

    // 添加连接
    const { nodes, edges } = useWorkflowStore.getState();

    // 手动添加边（简化处理）
    edges.push({
      id: 'demo-edge-1',
      source: 'start-1',
      target: 'llm-1',
    });
    edges.push({
      id: 'demo-edge-2',
      source: 'llm-1',
      target: 'end-1',
    });

    console.log('✅ 工作流创建完成');

    // 执行工作流
    await demoExecuteCurrentWorkflow();

  } catch (error) {
    console.error('💥 创建工作流失败:', error);
  }
}

/**
 * 演示：创建并执行一个分支工作流
 */
export async function demoBranchingWorkflow() {
  console.log('🌳 创建分支工作流 (Start -> LLM1 -> End, Start -> LLM2 -> End)...');

  try {
    // 重置工作流
    useWorkflowStore.getState().nodes.splice(0);
    useWorkflowStore.getState().edges.splice(0);
    useWorkflowStore.getState().nodeIdCounter = 0;

    // 添加节点
    useWorkflowStore.getState().addNode('start', { x: 100, y: 100 });
    useWorkflowStore.getState().addNode('llm', { x: 300, y: 50 });
    useWorkflowStore.getState().addNode('llm', { x: 300, y: 150 });
    useWorkflowStore.getState().addNode('end', { x: 500, y: 100 });

    // 配置不同的 LLM 节点
    const { nodes } = useWorkflowStore.getState();
    const llmNodes = nodes.filter(n => n.type === 'llm');
    if (llmNodes[0]) {
      llmNodes[0].data.systemPrompt = '你是一个技术专家，专注于解释技术概念';
      llmNodes[0].data.model = 'gpt-4o';
    }
    if (llmNodes[1]) {
      llmNodes[1].data.systemPrompt = '你是一个教育专家，擅长用简单语言解释复杂概念';
      llmNodes[1].data.model = 'claude-3.5';
    }

    console.log('✅ 分支工作流创建完成');

    // 注意：当前实现是顺序执行，无法真正并行执行分支
    // 这是一个简化实现，生产环境中需要更复杂的调度算法

  } catch (error) {
    console.error('💥 创建分支工作流失败:', error);
  }
}

// 开发环境下的调试函数
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 将演示函数挂载到 window 对象，方便在控制台调用
  (window as any).workflowDemo = {
    executeCurrent: demoExecuteCurrentWorkflow,
    createSimple: demoSimpleLinearWorkflow,
    createBranching: demoBranchingWorkflow,
  };

  console.log('🔧 工作流演示函数已加载，可在控制台使用:');
  console.log('  window.workflowDemo.executeCurrent() - 执行当前工作流');
  console.log('  window.workflowDemo.createSimple() - 创建简单线性工作流');
  console.log('  window.workflowDemo.createBranching() - 创建分支工作流');
}
