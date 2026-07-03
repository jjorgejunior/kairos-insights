import { create } from 'zustand';

export type Tab = 'filas' | 'pert' | 'estoques' | 'jogos' | 'copiloto';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface AppStore {
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  geminiApiKey: null,
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  clearGeminiApiKey: () => set({ geminiApiKey: null, chatHistory: [] }),
  chatHistory: [],
  addMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
  activeTab: 'filas',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
