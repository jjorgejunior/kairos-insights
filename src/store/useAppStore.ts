import { create } from "zustand";
import type { ThemeMode } from "@/data/clients";

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
  // Per-client theme overrides, persisted client-side. Falls back to each
  // client's own `theme` default (see Sidebar: `themes[id] ?? client.theme`)
  // when there's no override yet, so no upfront client list fetch is needed.
  try {
    const saved = JSON.parse(localStorage.getItem(LS_THEMES) || "null");
    if (saved && typeof saved === "object") return saved as Record<string, ThemeMode>;
  } catch {
    /* ignore */
  }
  return {};
}

interface AppStore {
  // theme per client (persisted)
  themes: Record<string, ThemeMode>;
  toggleTheme: (clientId: string) => void;

  // chat per client (session only)
  chats: Record<string, ChatMessage[]>;
  setChat: (clientId: string, msgs: ChatMessage[]) => void;
  clearChat: (clientId: string) => void;

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
