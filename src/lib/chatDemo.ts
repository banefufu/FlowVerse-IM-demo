/**
 * 聊天功能演示文件
 * 展示聊天界面与工作流执行引擎的集成
 */

import { useChatStore } from '../stores/chatStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { executeWorkflow } from './workflowRunner';

/**
 * 演示：模拟发送消息并查看工作流执行
 */
export async function demoChatWorkflow() {
  console.log('💬 开始演示聊天与工作流集成...');

  try {
    // 1. 检查工作流配置
    const { nodes, edges } = useWorkflowStore.getState();

    if (nodes.length === 0) {
      console.log('⚠️ 工作流为空，请先配置工作流节点');
      return;
    }

    console.log(`📊 当前工作流配置: ${nodes.length} 个节点，${edges.length} 条连接`);

    // 2. 模拟用户发送消息
    const userMessage = "请解释一下人工智能的发展历程";
    console.log(`👤 用户消息: "${userMessage}"`);

    // 3. 添加到聊天历史（模拟 UI 操作）
    const messageId = useChatStore.getState().addMessage('user', userMessage, 'sent');
    console.log(`✅ 用户消息已添加到聊天历史 (ID: ${messageId})`);

    // 4. 执行工作流
    console.log('🔄 开始执行工作流...');
    const results = await executeWorkflow(nodes, edges, userMessage);

    console.log('📋 工作流执行结果:');
    results.forEach((result, index) => {
      const node = nodes.find(n => n.id === result.nodeId);
      console.log(`${index + 1}. ${node?.data.label || result.nodeId}:`);
      console.log(`   状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log(`   输出长度: ${result.output.length} 字符`);
        console.log(`   输出预览: ${result.output.substring(0, 50)}${result.output.length > 50 ? '...' : ''}`);
      } else {
        console.log(`   错误: ${result.error}`);
      }
    });

    // 5. 找到最终结果并添加到聊天
    const endResult = results.find(r => r.nodeId.startsWith('end-'));
    if (endResult) {
      const aiMessageId = useChatStore.getState().addMessage(
        'assistant',
        endResult.success ? endResult.output : (endResult.error || '处理失败'),
        endResult.success ? 'completed' : 'error'
      );

      console.log(`🤖 AI 回复已添加到聊天历史 (ID: ${aiMessageId})`);
      console.log('🎉 聊天工作流演示完成！');
    }

  } catch (error) {
    console.error('💥 演示失败:', error);

    // 添加错误消息到聊天
    useChatStore.getState().addMessage(
      'assistant',
      `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'error'
    );
  }
}

/**
 * 演示：批量测试不同的问题
 */
export async function demoBatchChat() {
  console.log('🔄 开始批量聊天测试...');

  const testMessages = [
    "什么是机器学习？",
    "解释一下深度学习和神经网络",
    "AI 的未来发展趋势是什么？",
  ];

  for (let i = 0; i < testMessages.length; i++) {
    console.log(`\n📝 测试消息 ${i + 1}/${testMessages.length}:`);
    await demoChatWorkflow();

    // 添加延迟，避免执行过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎯 批量测试完成！');
}

/**
 * 演示：查看聊天历史
 */
export function demoChatHistory() {
  const { messages } = useChatStore.getState();

  console.log('📚 聊天历史记录:');
  console.log(`总消息数: ${messages.length}`);

  messages.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.role.toUpperCase()}] ${msg.timestamp.toLocaleTimeString()}`);
    console.log(`   状态: ${msg.status}`);
    console.log(`   内容: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    console.log('');
  });
}

/**
 * 演示：清空聊天历史
 */
export function demoClearChat() {
  useChatStore.getState().clearMessages();
  console.log('🗑️ 聊天历史已清空');
}

// 开发环境下的调试函数
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 将演示函数挂载到 window 对象，方便在控制台调用
  (window as any).chatDemo = {
    workflow: demoChatWorkflow,
    batch: demoBatchChat,
    history: demoChatHistory,
    clear: demoClearChat,
  };

  console.log('🎭 聊天演示函数已加载，可在控制台使用:');
  console.log('  window.chatDemo.workflow() - 执行单次聊天工作流');
  console.log('  window.chatDemo.batch() - 批量测试聊天');
  console.log('  window.chatDemo.history() - 查看聊天历史');
  console.log('  window.chatDemo.clear() - 清空聊天历史');
}
