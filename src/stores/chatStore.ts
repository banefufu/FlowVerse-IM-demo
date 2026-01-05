import { create } from 'zustand';

export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'sent' | 'thinking' | 'completed' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;

  // Actions
  addMessage: (role: MessageRole, content: string, status?: MessageStatus) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  updateMessageContent: (id: string, newContent: string) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
  getLastUserMessage: () => ChatMessage | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,

  addMessage: (role: MessageRole, content: string, status: MessageStatus = 'sent') => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message: ChatMessage = {
      id,
      role,
      content,
      status,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return id;
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  updateMessageContent: (id: string, newContent: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: newContent } : msg
      ),
    }));
  },

  setTyping: (typing: boolean) => {
    set({ isTyping: typing });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  getLastUserMessage: () => {
    const { messages } = get();
    return messages.filter(msg => msg.role === 'user').pop();
  },
}));
