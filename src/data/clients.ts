// Kairos OS — per-client configuration.
// Every screen is driven by this map: branding, copy, data and the Kairos
// recommendation for each front. Adding a client = adding an entry here;
// no screen code changes. Nothing numeric is precomputed — the utils derive
// ρ, Te, σ, Q*, Nash, "X/N SKUs em risco", etc. from these inputs at render.

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

export const CLIENTS: Record<string, ClientConfig> = {
  mcd: {
    id: "mcd",
    cliente: "McDonald's · Salvador Shopping",
    short: "McDonald's",
    local: "Salvador · BA",
    initial: "M",
    industry: "Food service",
    periodo: "JUN 2026",
    autor: "A. Kairos / PO-II",
    version: "v2.4",
    theme: "light",
    headline: "Diagnóstico operacional — Salvador Shopping",
    resumo:
      "Quatro frentes sob análise nesta unidade: a fila de atendimento no pico de jantar, o cronograma do lançamento regional, a política de estoque de perecíveis e o preço frente à concorrência direta.",
    filas: {
      canais: [
        { key: "balcao", label: "Balcão", lambda: 19.7, mu: 7.6, s: 4 },
        { key: "totem", label: "Totem", lambda: 13.8, mu: 7.6, s: 5 },
      ],
      volume: [
        { h: 10, balcao: 25, totem: 19.3 },
        { h: 11, balcao: 79.6, totem: 74.1 },
        { h: 12, balcao: 81.9, totem: 69.1 },
        { h: 13, balcao: 82.6, totem: 65.3 },
        { h: 14, balcao: 84.3, totem: 67.6 },
        { h: 15, balcao: 20.4, totem: 18.9 },
        { h: 16, balcao: 20.7, totem: 17.7 },
        { h: 17, balcao: 21.9, totem: 21.3 },
        { h: 18, balcao: 71, totem: 52.9 },
        { h: 19, balcao: 92.4, totem: 72 },
        { h: 20, balcao: 68.1, totem: 55 },
        { h: 21, balcao: 71.3, totem: 56.9 },
        { h: 22, balcao: 29.1, totem: 22.4 },
        { h: 23, balcao: 32.1, totem: 25 },
      ],
      sim: { lambda: 50, s: 3, serviceMin: 8 },
      rec: {
        tag: "REC-Q1",
        accent: "critical",
        titulo: "Reforçar o balcão de 4 para 5 atendentes no pico de jantar",
        corpo:
          "Com λ≈19,7/h e μ=7,6/h, ρ passa de 0,65 para 0,52 e Wq cai abaixo de 15s. O totem já opera folgado — o gargalo é humano, não digital.",
        impactoNum: "−38%",
        impactoLbl: "espera Wq no pico",
      },
    },
    pert: {
      atividades: [
        ["A", "Definição do produto e ficha técnica", [], 5, 7, 12, 0, 0, 4.5, 2000],
        ["B", "Aprovação corporativa do produto", ["A"], 8, 10, 15, 7.5, 7.5, 8.5, 1500],
        ["C", "Sourcing fornecedor de acarajé/vatapá", ["A"], 10, 14, 22, 7.5, 17.83, 14.67, 0],
        ["D", "Testes de degustação interna", ["A"], 4, 6, 9, 7.5, 36.98, 6.17, 0],
        ["E", "Definição de preço e margem", ["B", "D"], 3, 4, 6, 18, 43.15, 4.17, 0],
        ["F", "Negociação contrato fornecedor", ["C"], 5, 8, 13, 22.17, 32.5, 8.33, 0],
        ["G", "Compra de equipamento (fritadeira)", ["B"], 7, 12, 20, 18, 18, 11.5, 3750],
        ["H", "Adaptação física da cozinha", ["G"], 8, 10, 14, 30.5, 30.5, 7.33, 3333.33],
        ["I", "Compra de embalagens customizadas", ["E"], 6, 9, 14, 22.17, 58.83, 9.33, 0],
        ["J", "Treinamento técnico dos cozinheiros", ["F", "H"], 6, 8, 12, 40.83, 48.33, 8.33, 0],
        ["K", "Treinamento do balcão", ["E"], 3, 5, 8, 22.17, 48.32, 5.17, 0],
        ["L", "Adaptação PDV / cardápio digital", ["E"], 4, 6, 9, 22.17, 47.32, 6.17, 0],
        ["M", "Validação sanitária ANVISA", ["F", "H"], 10, 15, 25, 40.83, 40.83, 9.83, 1333.33],
        ["N", "Produção materiais de marketing", ["E"], 8, 11, 16, 22.17, 52.66, 11.33, 0],
        ["O", "Distribuição materiais nas lojas", ["N"], 3, 4, 6, 33.5, 63.99, 4.17, 0],
        ["P", "Treinamento gerentes (storytelling)", ["K", "L"], 2, 3, 5, 28.34, 53.49, 3.17, 0],
        ["Q", "Testes operacionais piloto", ["J", "M", "P"], 4, 6, 10, 56.66, 56.66, 3.33, 2000],
        ["R", "Ajustes pós-piloto", ["Q"], 3, 5, 8, 62.99, 62.99, 3.17, 2250],
        ["S", "Pré-lançamento (soft opening)", ["R", "I", "O"], 2, 3, 5, 68.16, 68.16, 2.17, 3500],
        ["T", "Análise de feedback", ["S"], 2, 3, 4, 71.33, 71.33, 2, 1500],
        ["U", "Ajustes finais", ["T"], 2, 4, 7, 74.33, 74.33, 2.17, 1500],
        ["V", "Lançamento oficial (Dia D)", ["U"], 1, 1, 2, 78.5, 78.5, 1.17, 10000],
      ],
      deadline: 85,
      budget: 50000,
      rec: {
        tag: "REC-P1",
        accent: "kairos",
        titulo: "Aprovar orçamento de crashing de R$ 50 mil para blindar o Dia D",
        corpo:
          "A duração esperada é derivada em 79,7d com P(T≤85)≈87%. Priorizando as críticas por menor custo/dia, R$ 49,2 mil comprimem o projeto a ~55,7d — margem para lançar no feriado-alvo.",
        impactoNum: "−24d",
        impactoLbl: "sobre a linha de base",
      },
    },
    estoque: {
      selected: "SKU-008",
      skus: [
        ["SKU-001", "Hambúrguer 90/10 (cx 100un)", 1820, 25, 22, 5, "PERIODO_FIXO"],
        ["SKU-002", "Hambúrguer quarteirão (cx 60un)", 950, 22, 28, 5, "PERIODO_FIXO"],
        ["SKU-003", "Pão Big Mac (pct 24un)", 2400, 18, 18, 7, "PERIODO_FIXO"],
        ["SKU-004", "Pão brioche premium (pct 24un)", 850, 15, 16, 5, "PERIODO_FIXO"],
        ["SKU-005", "Pão padrão (pct 24un)", 3200, 18, 15, 7, "PERIODO_FIXO"],
        ["SKU-006", "Queijo cheddar fatiado (1kg)", 1450, 60, 12, 30, "REVISAO_PERIODICA"],
        ["SKU-007", "Bacon fatiado (500g)", 780, 80, 14, 21, "REVISAO_PERIODICA"],
        ["SKU-008", "Alface americana (cx 5kg)", 950, 12, 18, 4, "PERIODO_FIXO"],
        ["SKU-009", "Tomate italiano (cx 5kg)", 720, 12, 15, 4, "PERIODO_FIXO"],
        ["SKU-010", "Cebola roxa fatiada (kg)", 480, 40, 14, 7, "PERIODO_FIXO"],
        ["SKU-011", "Batata pré-frita (cx 6×2,5kg)", 2200, 220, 15, 90, "EOQ_CLASSICO"],
        ["SKU-012", "Big Mac sauce (galão 4L)", 96, 380, 22, 60, "REVISAO_PERIODICA"],
        ["SKU-013", "Ketchup (galão 4L)", 240, 80, 5.5, 180, "EOQ_CLASSICO"],
        ["SKU-014", "Mostarda amarela (galão 4L)", 180, 80, 5, 180, "EOQ_CLASSICO"],
        ["SKU-015", "Picles (balde 5L)", 200, 80, 6.5, 90, "REVISAO_PERIODICA"],
      ],
      rec: {
        tag: "REC-E1",
        accent: "critical",
        titulo: "Migrar perecíveis frescos de EOQ para reposição por período fixo",
        corpo:
          "Para os SKUs cujo Q* supera a validade, o lote ótimo é inviável: reposição diária/2-em-2-dias por nível-alvo elimina perda por vencimento ao custo de mais pedidos.",
        impactoNum: "0",
        impactoLbl: "SKUs em risco de perda",
      },
    },
    jogos: {
      selected: 0,
      cenarios: [
        {
          id: "A",
          titulo: "McDonald's × Burger King",
          tipo: "Dilema do Prisioneiro — promoção de combos",
          linha: "McDonald's",
          coluna: "Burger King",
          estLinha: ["Promoção", "Preço cheio"],
          estColuna: ["Promoção", "Preço cheio"],
          matrix: [
            [
              [45, 38],
              [95, 25],
            ],
            [
              [28, 88],
              [75, 65],
            ],
          ],
          leitura:
            "Nash em (Promoção, Promoção). O par cooperativo (Preço cheio, Preço cheio)=(75,65) é melhor para ambos mas instável: cada lado ganha desviando (95 vs 75). Só sustentável com jogo repetido.",
        },
        {
          id: "B",
          titulo: "McDonald's × Madero",
          tipo: "Dominância estrita — posicionamento de preço",
          linha: "McDonald's",
          coluna: "Madero",
          estLinha: ["Premium R$35", "Manter R$22"],
          estColuna: ["Alto R$45", "Desconto R$35"],
          matrix: [
            [
              [62, 78],
              [38, 95],
            ],
            [
              [85, 68],
              [72, 82],
            ],
          ],
          leitura:
            'Por dominância: "Manter R$22" domina "Premium" para o McD; "Desconto R$35" domina "Alto" para o Madero. IEDS leva a um Nash puro único: (Manter, Desconto)=(72,82).',
        },
        {
          id: "C",
          titulo: "McDonald's × Subway",
          tipo: "Coordenação — expansão do café da manhã",
          linha: "McDonald's",
          coluna: "Subway",
          estLinha: ["Investir forte", "Manter atual"],
          estColuna: ["Investir forte", "Manter atual"],
          matrix: [
            [
              [35, 32],
              [78, 18],
            ],
            [
              [15, 85],
              [52, 50],
            ],
          ],
          leitura:
            "Investir forte é dominante para os dois — não é coordenação, é dilema do prisioneiro disfarçado. Nash puro único: (Investir, Investir)=(35,32).",
        },
      ],
      rec: {
        tag: "REC-J1",
        accent: "kairos",
        titulo: "Contra o Madero, manter a linha R$22 em vez de lançar premium",
        corpo:
          "Independentemente da resposta do concorrente, manter R$22 domina o lançamento premium (85>62 e 72>38). O equilíbrio estável entrega payoff 72.",
        impactoNum: "+16",
        impactoLbl: "payoff vs. premium",
      },
      precosCampoPlayers: ["McD", "BK", "Subway", "Madero"],
      precosCampoLabel: "Coletado em campo · Salvador Shopping · Jun/2026",
      precosCampo: [
        { categoria: "Sanduíche premium", precos: [28.9, 29.9, 27.9, 38.9] },
        { categoria: "Sanduíche premium 2", precos: [30.9, 33.9, 29.9, 42.9] },
        { categoria: "Sanduíche barato", precos: [10.9, 11.9, 18.9, null] },
        { categoria: "Combo médio", precos: [39.9, 41.9, null, null] },
        { categoria: "Combo premium", precos: [46.9, 48.9, null, 59.9] },
        { categoria: "Batata", precos: [11.9, 12.9, null, 14.9] },
        { categoria: "Sobremesa", precos: [15.9, 13.9, 8.9, 16.9] },
        { categoria: "Bebida (350ml)", precos: [8.9, 8.9, 8.5, 9.9] },
        { categoria: "Café da manhã", precos: [15.9, 16.9, null, null] },
        { categoria: "Kids", precos: [31.9, 29.9, null, null] },
      ],
    },
  },

  hospital: {
    id: "hospital",
    cliente: "Rede Aliança · Pronto-Atendimento",
    short: "Rede Aliança",
    local: "Recife · PE",
    initial: "A",
    industry: "Saúde",
    periodo: "MAI 2026",
    autor: "A. Kairos / PO-II",
    version: "v1.1",
    theme: "dark",
    headline: "Diagnóstico operacional — Pronto-atendimento Recife",
    resumo:
      "Quatro frentes sob análise na unidade de pronto-atendimento: a fila de triagem no turno noturno, o cronograma de implantação dos novos leitos, o estoque de insumos com validade curta e o posicionamento de convênios frente à rede concorrente.",
    filas: {
      canais: [
        { key: "triagem", label: "Triagem", lambda: 28, mu: 12, s: 3 },
        { key: "consulta", label: "Consulta", lambda: 22, mu: 6, s: 5 },
      ],
      volume: [
        { h: 10, triagem: 14, consulta: 11 },
        { h: 11, triagem: 18, consulta: 15 },
        { h: 12, triagem: 22, consulta: 17 },
        { h: 13, triagem: 20, consulta: 16 },
        { h: 14, triagem: 16, consulta: 13 },
        { h: 15, triagem: 15, consulta: 12 },
        { h: 16, triagem: 19, consulta: 14 },
        { h: 17, triagem: 24, consulta: 18 },
        { h: 18, triagem: 31, consulta: 24 },
        { h: 19, triagem: 34, consulta: 27 },
        { h: 20, triagem: 29, consulta: 23 },
        { h: 21, triagem: 26, consulta: 20 },
        { h: 22, triagem: 19, consulta: 15 },
        { h: 23, triagem: 15, consulta: 12 },
      ],
      sim: { lambda: 34, s: 3, serviceMin: 5 },
      rec: {
        tag: "REC-Q1",
        accent: "critical",
        titulo: "Terceiro enfermeiro de triagem no pico noturno (18h–21h)",
        corpo:
          "Com λ≈28/h e μ=12/h, ρ com 2 enfermeiros passa de 1 (instável). Com 3, ρ=0,78 e Wq cai a poucos minutos — dentro da meta do protocolo Manchester.",
        impactoNum: "ρ 0,78",
        impactoLbl: "sistema estável",
      },
    },
    pert: {
      atividades: [
        ["A", "Projeto arquitetônico da ala", [], 4, 6, 10, 0, 0, 3, 3000],
        ["B", "Aprovação da vigilância sanitária", ["A"], 8, 12, 20, 6.5, 6.5, 7, 2000],
        ["C", "Compra de mobiliário hospitalar", ["A"], 5, 7, 11, 6.5, 14.5, 5, 0],
        ["D", "Obra civil e adequação elétrica", ["B"], 10, 15, 24, 12.83, 12.83, 9, 4500],
        ["E", "Instalação de gases medicinais", ["D"], 5, 8, 12, 28.17, 28.17, 6, 3800],
        ["F", "Compra de monitores e bombas", ["B"], 7, 10, 16, 12.83, 20.5, 7, 0],
        ["G", "Certificação de gases (checklist)", ["E"], 3, 4, 6, 36.5, 36.5, 3.5, 2500],
        ["H", "Contratação de equipe de enfermagem", ["C"], 12, 18, 28, 11.5, 24.17, 14, 0],
        ["I", "Treinamento da equipe clínica", ["G", "F", "H"], 5, 7, 11, 40.67, 40.67, 6, 1800],
        ["J", "Homologação com operadoras", ["I"], 6, 9, 14, 47.67, 47.67, 7, 2200],
        ["K", "Simulação operacional (dry-run)", ["J"], 3, 4, 6, 57, 57, 3.5, 3000],
        ["L", "Abertura assistida dos leitos", ["K"], 2, 3, 5, 61.17, 61.17, 2, 6000],
      ],
      deadline: 70,
      budget: 30000,
      rec: {
        tag: "REC-P1",
        accent: "kairos",
        titulo: "Antecipar a contratação de enfermagem para o dia zero",
        corpo:
          "A atividade H (contratação, 18d) alimenta o caminho crítico via treinamento. Iniciá-la em paralelo à obra retira o maior risco de atraso da abertura.",
        impactoNum: "87%",
        impactoLbl: "P(T ≤ 70 dias)",
      },
    },
    estoque: {
      selected: "INS-003",
      skus: [
        ["INS-001", "Soro fisiológico 500ml (cx 24)", 5200, 40, 8, 540, "EOQ_CLASSICO"],
        ["INS-002", "Luva estéril (cx 100 pares)", 9800, 30, 6, 720, "EOQ_CLASSICO"],
        ["INS-003", "Kit sutura descartável", 1400, 45, 14, 180, "REVISAO_PERIODICA"],
        ["INS-004", "Adrenalina ampola (cx 50)", 620, 60, 22, 90, "REVISAO_PERIODICA"],
        ["INS-005", "Hemocomponente O- (bolsa)", 180, 120, 60, 35, "PERIODO_FIXO"],
        ["INS-006", "Antibiótico IV frasco (cx 25)", 940, 55, 18, 120, "REVISAO_PERIODICA"],
        ["INS-007", "Gaze estéril pacote", 7200, 20, 4, 365, "EOQ_CLASSICO"],
        ["INS-008", "Reagente laboratorial (kit)", 430, 90, 30, 45, "PERIODO_FIXO"],
      ],
      rec: {
        tag: "REC-E1",
        accent: "critical",
        titulo: "Hemocomponentes e reagentes em reposição por validade, não por Q*",
        corpo:
          "Para bolsas O- (35d) e reagentes (45d), o lote econômico excede a validade. Reposição por nível-alvo com janela curta protege contra descarte de item crítico.",
        impactoNum: "0",
        impactoLbl: "itens críticos em risco",
      },
    },
    jogos: {
      selected: 0,
      cenarios: [
        {
          id: "A",
          titulo: "Aliança × Rede concorrente",
          tipo: "Credenciamento de convênios — 3 estratégias",
          linha: "Aliança",
          coluna: "Concorrente",
          estLinha: ["Preço agressivo", "Preço médio", "Premium"],
          estColuna: ["Preço agressivo", "Preço médio", "Premium"],
          matrix: [
            [
              [30, 30],
              [50, 42],
              [66, 24],
            ],
            [
              [42, 50],
              [55, 55],
              [62, 46],
            ],
            [
              [24, 66],
              [46, 62],
              [58, 58],
            ],
          ],
          leitura:
            "Matriz 3×3: o único equilíbrio de Nash puro é (Preço médio, Preço médio)=(55,55). Dado o rival na faixa média, cada rede piora ao migrar para guerra de preço (50<55) ou para premium (46<55). A guerra agressiva (30,30) é um resultado inferior para ambos.",
        },
      ],
      rec: {
        tag: "REC-J1",
        accent: "kairos",
        titulo: "Posicionar convênios em faixa média, evitando guerra de preço",
        corpo:
          "O Nash puro (Preço médio, Preço médio) supera a alternativa agressiva em payoff conjunto: manter a faixa média protege a receita sem provocar retaliação da concorrente.",
        impactoNum: "55",
        impactoLbl: "payoff no equilíbrio",
      },
    },
  },
};

export const CLIENT_ORDER = ["mcd", "hospital"] as const;
export const DEFAULT_CLIENT = "mcd";
export const SECTIONS = ["painel", "filas", "cronograma", "estoques", "jogos", "copiloto"] as const;
export type Section = (typeof SECTIONS)[number];

export function isClient(id: string | undefined): id is string {
  return !!id && id in CLIENTS;
}
export function isSection(s: string | undefined): s is Section {
  return !!s && (SECTIONS as readonly string[]).includes(s);
}
