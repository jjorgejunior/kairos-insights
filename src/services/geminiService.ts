// Gemini API service — system prompt built entirely from derived client data
// (nothing hardcoded) + a server-only sendMessage that keeps GEMINI_API_KEY
// off the client (never in the URL, headers, or JS bundle).

import { createServerFn } from "@tanstack/react-start";
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
 * Server function: sends a chat turn to Gemini. Runs only on the server —
 * GEMINI_API_KEY is read from process.env and never reaches the browser.
 */
export const sendMessage = createServerFn({ method: "POST" })
  .validator((data: SendMessageInput) => data)
  .handler(async ({ data }): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY não configurada no servidor. Defina a variável de ambiente na hospedagem.",
      );
    }

    const { history, userMessage, systemPrompt } = data;
    const contents = [
      ...history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
          signal: controller.signal,
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error("Tempo de resposta esgotado. Tente reenviar.");
        }
        throw e;
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error("Chave da API Gemini inválida ou sem permissão no servidor.");
      }
      if (res.status === 429) {
        throw new Error("Cota da API Gemini excedida. Tente novamente mais tarde.");
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro Gemini (${res.status}): ${text.slice(0, 200)}`);
      }

      const resData = await res.json();
      const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta vazia da Gemini.");
      return text as string;
    } finally {
      clearTimeout(timer);
    }
  });
