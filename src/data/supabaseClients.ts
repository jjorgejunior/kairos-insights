// Loads ClientConfig from the Lovable Cloud (Supabase) database instead of
// a hardcoded object. Same shape as the old static CLIENTS map — screens
// don't need to change, only the loading layer does.

import { supabase } from "@/integrations/supabase/client";
import type {
  ClientConfig,
  GameScenario,
  PertTuple,
  Recommendation,
  SkuCat,
  SkuTuple,
  ThemeMode,
} from "./clients";

export interface ClientSummary {
  id: string;
  short: string;
  initial: string;
  industry: string;
  theme: ThemeMode;
}

export async function fetchClientList(): Promise<ClientSummary[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, short, initial, industry, theme")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    short: r.short,
    initial: r.initial,
    industry: r.industry,
    theme: r.theme as ThemeMode,
  }));
}

function recFor(rows: { frente: string }[], frente: string): Recommendation {
  const r = rows.find((x) => x.frente === frente);
  if (!r) throw new Error(`Missing recommendation for frente="${frente}"`);
  const row = r as unknown as {
    tag: string;
    accent: Recommendation["accent"];
    titulo: string;
    corpo: string;
    impacto_num: string;
    impacto_lbl: string;
  };
  return {
    tag: row.tag,
    accent: row.accent,
    titulo: row.titulo,
    corpo: row.corpo,
    impactoNum: row.impacto_num,
    impactoLbl: row.impacto_lbl,
  };
}

export async function fetchClientConfig(id: string): Promise<ClientConfig | null> {
  const [
    clientRes,
    recsRes,
    canaisRes,
    volumeRes,
    simRes,
    pertConfigRes,
    atividadesRes,
    estoqueConfigRes,
    skusRes,
    jogosConfigRes,
    cenariosRes,
    precosRes,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("recomendacoes").select("*").eq("client_id", id),
    supabase.from("filas_canais").select("*").eq("client_id", id).order("sort_order"),
    supabase.from("filas_volume").select("*").eq("client_id", id).order("hora"),
    supabase.from("filas_sim").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("pert_config").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("pert_atividades").select("*").eq("client_id", id).order("sort_order"),
    supabase.from("estoque_config").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("estoque_skus").select("*").eq("client_id", id).order("sort_order"),
    supabase.from("jogos_config").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("jogos_cenarios").select("*").eq("client_id", id).order("sort_order"),
    supabase.from("jogos_precos_campo").select("*").eq("client_id", id).order("sort_order"),
  ]);

  for (const res of [
    clientRes,
    recsRes,
    canaisRes,
    volumeRes,
    simRes,
    pertConfigRes,
    atividadesRes,
    estoqueConfigRes,
    skusRes,
    jogosConfigRes,
    cenariosRes,
    precosRes,
  ]) {
    if (res.error) throw res.error;
  }

  const c = clientRes.data;
  if (!c) return null;

  const recs = recsRes.data ?? [];

  // Pivot filas_volume (long: client_id, hora, canal_key, valor) into the
  // wide shape screens expect: { h, [canalKey]: valor, ... }.
  const volumeByHora = new Map<number, { h: number } & Record<string, number>>();
  for (const row of volumeRes.data ?? []) {
    const entry: { h: number } & Record<string, number> =
      volumeByHora.get(row.hora) ?? { h: row.hora };
    entry[row.canal_key] = Number(row.valor);
    volumeByHora.set(row.hora, entry);
  }

  const pertTuples: PertTuple[] = (atividadesRes.data ?? []).map((a) => [
    a.codigo,
    a.descricao,
    a.predecessoras,
    Number(a.o),
    Number(a.m),
    Number(a.p),
    Number(a.es),
    Number(a.ls),
    a.floor == null ? 0 : Number(a.floor),
    Number(a.crash_cost),
  ]);

  const skuTuples: SkuTuple[] = (skusRes.data ?? []).map((s) => [
    s.codigo,
    s.descricao,
    Number(s.d_anual),
    Number(s.s_pedido),
    Number(s.h_unit_ano),
    Number(s.validade_dias),
    s.categoria as SkuCat,
  ]);

  const cenarios: GameScenario[] = (cenariosRes.data ?? []).map((g) => ({
    id: g.cenario_id,
    titulo: g.titulo,
    tipo: g.tipo,
    linha: g.linha,
    coluna: g.coluna,
    estLinha: g.est_linha,
    estColuna: g.est_coluna,
    matrix: g.matrix as [number, number][][],
    leitura: g.leitura,
  }));

  const precosCampo = (precosRes.data ?? []).map((p) => ({
    categoria: p.categoria,
    precos: p.precos as (number | null)[],
  }));

  const jc = jogosConfigRes.data;
  const sim = simRes.data;
  const pc = pertConfigRes.data;
  const ec = estoqueConfigRes.data;

  const config: ClientConfig = {
    id: c.id,
    cliente: c.cliente,
    short: c.short,
    local: c.local,
    initial: c.initial,
    industry: c.industry,
    periodo: c.periodo,
    autor: c.autor,
    version: c.version,
    theme: c.theme as ThemeMode,
    headline: c.headline,
    resumo: c.resumo,
    filas: {
      canais: (canaisRes.data ?? []).map((ch) => ({
        key: ch.key,
        label: ch.label,
        lambda: Number(ch.lambda),
        mu: Number(ch.mu),
        s: ch.s,
      })),
      volume: [...volumeByHora.values()].sort((a, b) => a.h - b.h),
      sim: sim
        ? { lambda: Number(sim.lambda), s: sim.s, serviceMin: Number(sim.service_min) }
        : { lambda: 0, s: 1, serviceMin: 1 },
      pool:
        sim?.pool_lambda != null && sim?.pool_mu != null && sim?.pool_s != null
          ? { lambda: Number(sim.pool_lambda), mu: Number(sim.pool_mu), s: Number(sim.pool_s) }
          : undefined,
      rec: recFor(recs, "filas"),
    },
    pert: {
      atividades: pertTuples,
      deadline: pc ? Number(pc.deadline) : 0,
      budget: pc ? Number(pc.budget) : 0,
      rec: recFor(recs, "pert"),
    },
    estoque: {
      selected: ec?.selected_sku ?? skuTuples[0]?.[0] ?? "",
      skus: skuTuples,
      rec: recFor(recs, "estoque"),
    },
    jogos: {
      selected: jc?.selected_index ?? 0,
      cenarios,
      rec: recFor(recs, "jogos"),
      precosCampoPlayers: jc?.precos_campo_players ?? undefined,
      precosCampoLabel: jc?.precos_campo_label ?? undefined,
      precosCampo: precosCampo.length > 0 ? precosCampo : undefined,
    },
  };

  return config;
}
