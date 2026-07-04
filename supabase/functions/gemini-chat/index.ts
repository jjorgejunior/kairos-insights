// Supabase Edge Function — proxies chat turns to Gemini.
// GEMINI_API_KEY lives only in Supabase secrets (set via Lovable Cloud);
// it never reaches the browser in any URL, header, or JS bundle.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeminiMsg {
  role: "user" | "model";
  content: string;
}

interface RequestBody {
  history: GeminiMsg[];
  userMessage: string;
  systemPrompt: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { history, userMessage, systemPrompt } = (await req.json()) as RequestBody;

    if (!userMessage || typeof userMessage !== "string") {
      return new Response(JSON.stringify({ error: "userMessage é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contents = [
      ...(history ?? []).map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt ?? "" }] },
        }),
        signal: controller.signal,
      });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "AbortError";
      return new Response(
        JSON.stringify({
          error: timedOut ? "Tempo de resposta esgotado. Tente reenviar." : "Falha ao contatar a Gemini.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 403) {
      return new Response(
        JSON.stringify({ error: "Chave da API Gemini inválida ou sem permissão no servidor." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Cota da API Gemini excedida. Tente novamente mais tarde." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: `Erro Gemini (${res.status}): ${text.slice(0, 200)}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: "Resposta vazia da Gemini." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro interno na função." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
