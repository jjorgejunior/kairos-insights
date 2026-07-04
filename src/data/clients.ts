// Kairos OS — client engagement types + shape helpers.
// Actual client data now lives in the Lovable Cloud (Supabase) database —
// see src/data/supabaseClients.ts for the fetch layer. This file only keeps
// the TypeScript shapes (ClientConfig et al.) and route helpers (Section).

import type { RawActivity } from "@/utils/pert";

export type ThemeMode = "light" | "dark";
export type AccentKey = "critical" | "kairos" | "optimal" | "amber";

export interface Recommendation {
  tag: string;
  accent: AccentKey;
  titulo: string;
  corpo: string;
  impactoNum: string;
  impactoLbl: string;
}

export interface FilasCanal {
  key: string;
  label: string;
  lambda: number; // arrivals/hour
  mu: number; // service rate/hour per server
  s: number; // servers
}

export interface FilasData {
  canais: FilasCanal[];
  volume: Array<{ h: number } & Record<string, number>>;
  sim: { lambda: number; s: number; serviceMin: number };
  rec: Recommendation;
}

// [codigo, desc, pred[], o, m, p, es, ls, floor, crashCost]
export type PertTuple = [
  string,
  string,
  string[],
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface PertData {
  atividades: PertTuple[];
  deadline: number;
  budget: number;
  rec: Recommendation;
}

export type SkuCat = "EOQ_CLASSICO" | "REVISAO_PERIODICA" | "PERIODO_FIXO";
// [codigo, desc, D_anual, S_pedido, H_unit_ano, validade_dias, categoria]
export type SkuTuple = [string, string, number, number, number, number, SkuCat];

export interface EstoqueData {
  selected: string;
  skus: SkuTuple[];
  rec: Recommendation;
}

export interface GameScenario {
  id: string;
  titulo: string;
  tipo: string;
  linha: string;
  coluna: string;
  estLinha: string[];
  estColuna: string[];
  matrix: [number, number][][]; // matrix[i][j] = [payoff linha, payoff coluna]
  leitura: string;
}

export interface PrecoCampo {
  categoria: string;
  precos: (number | null)[]; // aligned with JogosData.precosCampoPlayers
}

export interface JogosData {
  selected: number;
  cenarios: GameScenario[];
  rec: Recommendation;
  // Optional real-world price survey — only rendered when a client has this data.
  precosCampoPlayers?: string[];
  precosCampoLabel?: string; // e.g. "Coletado em campo · Salvador Shopping · Jun/2026"
  precosCampo?: PrecoCampo[];
}

export interface ClientConfig {
  id: string;
  cliente: string;
  short: string;
  local: string;
  initial: string;
  industry: string;
  periodo: string;
  autor: string;
  version: string;
  theme: ThemeMode; // default theme for this engagement (user can toggle; persisted)
  headline: string;
  resumo: string;
  filas: FilasData;
  pert: PertData;
  estoque: EstoqueData;
  jogos: JogosData;
}

/** Convert a client's PERT tuples into the RawActivity shape the utils expect. */
export function toRawActivities(tuples: PertTuple[]): RawActivity[] {
  return tuples.map((a) => ({
    codigo: a[0],
    desc: a[1],
    pred: a[2],
    o: a[3],
    m: a[4],
    p: a[5],
    es: a[6],
    ls: a[7],
    floor: a[8],
    crashCost: a[9],
  }));
}

export const DEFAULT_CLIENT = "mcd";
export const SECTIONS = ["painel", "filas", "cronograma", "estoques", "jogos", "copiloto"] as const;
export type Section = (typeof SECTIONS)[number];

export function isSection(s: string | undefined): s is Section {
  return !!s && (SECTIONS as readonly string[]).includes(s);
}
