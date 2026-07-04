import { create } from "zustand";
import { CLIENTS, type ThemeMode } from "@/data/clients";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  t: number;
}

export interface TipState {
  x: number;
  y: number;
  html: string;
}

export type PrintScope = "section" | "all";

const LS_THEMES = "kairos-themes";

function seedThemes(): Record<string, ThemeMode> {
  const base: Record<string, ThemeMode> = {};
  for (const id of Object.keys(CLIENTS)) base[id] = CLIENTS[id].theme;
  try {
    const saved = JSON.parse(localStorage.getItem(LS_THEMES) || "null");
    if (saved && typeof saved === "object") return { ...base, ...saved };
  } catch {
    /* ignore */
  }
  return base;
}

interface AppStore {
  // theme per client (persisted)
  themes: Record<string, ThemeMode>;
  toggleTheme: (clientId: string) => void;

  // chat per client (session only)
  chats: Record<string, ChatMessage[]>;
  setChat: (clientId: string, msgs: ChatMessage[]) => void;
  clearChat: (clientId: string) => void;

  // gemini key — memory only, never persisted
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;

  // global cursor-following tooltip
  tip: TipState | null;
  setTip: (x: number, y: number, html: string) => void;
  moveTip: (x: number, y: number) => void;
  clearTip: () => void;

  // project-switch loading overlay
  loading: boolean;
  setLoading: (v: boolean) => void;

  // export / print
  exportMenu: boolean;
  printMode: boolean;
  printScope: PrintScope;
  toggleExportMenu: () => void;
  closeExportMenu: () => void;
  setPrint: (mode: boolean, scope: PrintScope) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  themes: seedThemes(),
  toggleTheme: (clientId) =>
    set((s) => {
      const next: ThemeMode = s.themes[clientId] === "dark" ? "light" : "dark";
      const themes = { ...s.themes, [clientId]: next };
      try {
        localStorage.setItem(LS_THEMES, JSON.stringify(themes));
      } catch {
        /* ignore */
      }
      return { themes };
    }),

  chats: {},
  setChat: (clientId, msgs) => set((s) => ({ chats: { ...s.chats, [clientId]: msgs } })),
  clearChat: (clientId) => set((s) => ({ chats: { ...s.chats, [clientId]: [] } })),

  geminiApiKey: null,
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  clearGeminiApiKey: () => set({ geminiApiKey: null }),

  tip: null,
  setTip: (x, y, html) => set({ tip: { x, y, html } }),
  moveTip: (x, y) => set((s) => (s.tip ? { tip: { ...s.tip, x, y } } : {})),
  clearTip: () => set((s) => (s.tip ? { tip: null } : {})),

  loading: false,
  setLoading: (v) => set({ loading: v }),

  exportMenu: false,
  printMode: false,
  printScope: "all",
  toggleExportMenu: () => set((s) => ({ exportMenu: !s.exportMenu })),
  closeExportMenu: () => set({ exportMenu: false }),
  setPrint: (mode, scope) => set({ printMode: mode, printScope: scope }),
}));
