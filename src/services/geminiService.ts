// Gemini API service — system prompt built entirely from derived client data
// (nothing hardcoded) + a sendMessage that calls the "gemini-chat" Supabase
// edge function. GEMINI_API_KEY lives only in Supabase secrets (Lovable
// Cloud) and never reaches the browser — not in the URL, headers, or bundle.

import { supabase } from "@/integrations/supabase/client";
import type { ClientConfig } from "@/data/clients";
import { toRawActivities } from "@/data/clients";
import { derivePert, runCrashing } from "@/utils/pert";
import { calcEOQ, daysToConsume } from "@/utils/eoq";
import { calcMMs } from "@/utils/queuing";
import { findNashPure } from "@/utils/nash";

/** Build the Gemini system prompt from live client data (mirrors the prototype's buildSystemPrompt). */
export function buildSystemPrompt(client: ClientConfig): string {
  const pt = derivePert(toRawActivities(client.pert.atividades));

  const eRows = client.estoque.skus.map(([, , D, S, H, val]) => {
    const { Q } = calcEOQ(D, S, H);
    return { viola: daysToConsume(Q, D) > val };
  });
  const violaCount = eRows.filter((r) => r.viola).length;

  const crash = runCrashing(pt.acts, client.pert.budget, pt.duracao);

  const f = client.filas.canais[0];
  const mm = calcMMs(f.lambda, f.mu, f.s);

  const nashScen = client.jogos.cenarios[0];
  const ne = findNashPure(nashScen.matrix);
  const nashTxt =
    ne.map(([i, j]) => `(${nashScen.estLinha[i]}, ${nashScen.estColuna[j]})`).join("; ") ||
    "sem Nash puro";

  return `Você é o Consultor Chefe de Pesquisa Operacional da Kairos Consulting, atuando no engajamento "${client.cliente}" (${client.industry}), período ${client.periodo}.
REGRAS:
1. Domina Teoria das Filas (M/M/s Erlang-C), PERT/CPM, Estoques EOQ/EPQ e Teoria dos Jogos.
2. EXPLICABILIDADE OBRIGATÓRIA: toda resposta DEVE citar a fórmula/conceito usado (ex.: ρ=λ/(s·μ), Q*=√(2DS/H), Folga=LS−ES, Nash = ninguém melhora desviando unilateralmente).
3. Responda em português, técnico, didático e direto. Máx. 6–8 linhas salvo pedido de detalhe.
4. DADOS REAIS DERIVADOS deste engajamento (nunca invente):
 • Filas ${f.label}: λ=${f.lambda}/h, μ=${f.mu}/h, s=${f.s} → ρ=${(mm.rho * 100).toFixed(1)}%, Wq=${(mm.Wq * 3600).toFixed(0)}s.
 • PERT: duração esperada Te=${pt.duracao}d, σ=${pt.sigma}d, ${pt.cp.length}/${pt.acts.length} atividades críticas (caminho ${pt.cp.join("-")}). Crashing R$${crash.spent.toLocaleString("pt-BR")} → ${crash.finalDuration}d.
 • Estoques: ${violaCount}/${eRows.length} SKUs com Q* acima da validade.
 • Jogos (${nashScen.titulo}): Nash puro em ${nashTxt}.`;
}

export interface GeminiMsg {
  role: "user" | "model";
  content: string;
}

interface SendMessageInput {
  history: GeminiMsg[];
  userMessage: string;
  systemPrompt: string;
}

/**
 * Calls the "gemini-chat" Supabase edge function, which holds GEMINI_API_KEY
 * as a server-side secret and proxies the call to Gemini.
 */
export async function sendMessage({
  history,
  userMessage,
  systemPrompt,
}: SendMessageInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>(
    "gemini-chat",
    { body: { history, userMessage, systemPrompt } },
  );

  if (error) throw new Error(error.message || "Falha ao contatar o copiloto.");
  if (data?.error) throw new Error(data.error);
  if (!data?.text) throw new Error("Resposta vazia da Gemini.");
  return data.text;
}
