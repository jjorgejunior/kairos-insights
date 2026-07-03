const SYSTEM_PROMPT = `Você é o Consultor Chefe de Pesquisa Operacional da Kairos Consulting,
atuando no diagnóstico operacional do McDonald's Salvador Shopping.

REGRAS:
1. Domina os 4 temas: Teoria das Filas (M/M/s), PERT/CPM, Estoques EOQ/EPQ e Teoria dos Jogos.
2. EXPLICABILIDADE OBRIGATÓRIA: toda resposta DEVE citar a fórmula matemática, teorema ou
   conceito utilizado (ex: ρ=λ/(s·μ), Q*=√(2DS/H), Folga=LS-ES, Nash=nenhum jogador
   melhora desviando unilateralmente).
3. Responda em português, de forma técnica, didática e direta.
4. Use os dados reais do projeto: duração PERT=79.67d, λ campo médio=19.7/h, μ=7.6/h,
   12/15 SKUs violam validade, Nash Cenário A=(Promoção,Promoção).
5. Máximo 6-8 linhas, exceto quando solicitado detalhe.`;

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export async function sendMessage(
  apiKey: string,
  history: GeminiMessage[],
  userMessage: string,
): Promise<string> {
  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.parts }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Chave da API Gemini inválida ou sem permissão. Verifique e tente novamente.');
  }
  if (res.status === 429) {
    throw new Error('Cota da API Gemini excedida. Aguarde ou use outra chave.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro Gemini (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia da Gemini.');
  return text as string;
}
