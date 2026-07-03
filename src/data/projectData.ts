// Kairos Consulting – McDonald's Salvador Shopping
// Real project data. NO hardcoded results in components — everything flows from here.

export interface FieldSession {
  id: string;
  data: string;
  dia: string;
  periodo: string;
  n: number;
  duracao_min: number;
  lambda_min: number;
  lambda_hora: number;
  cv: number;
  s_atendentes: number; // atendentes no balcão durante esta visita específica
}

export interface FieldService {
  n: number;
  media_min: number;
  mu_hora: number;
  cv: number;
}

export interface SyntheticChannel {
  n: number;
  tempo_medio_servico: number; // minutes
  cv_servico: number;
  atendentes_efetivos: number;
}

export interface HourVolume {
  hora: number;
  balcao: number;
  totem: number;
}

export interface PertActivity {
  codigo: string;
  descricao: string;
  predecessoras: string[];
  o: number; // optimistic
  m: number; // most likely
  p: number; // pessimistic
  te: number;
  variancia: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  folga: number;
  critica: boolean;
  duracao_min_dias?: number; // crash floor
  custo_crash_dia?: number;
}

export interface SKU {
  codigo: string;
  descricao: string;
  D_anual: number;
  S_pedido: number;
  H_unit_ano: number;
  validade_dias: number;
  categoria: 'EOQ_CLASSICO' | 'REVISAO_PERIODICA' | 'PERIODO_FIXO';
  abordagem: string;
}

export interface GameScenario {
  id: string;
  titulo: string;
  tipo: string;
  jogador_linha: string;
  jogador_coluna: string;
  estrategias_linha: [string, string];
  estrategias_coluna: [string, string];
  // matrix[i][j] = [payoff_linha, payoff_coluna]
  matrix: [number, number][][];
  leitura: string;
}

// ---------- FILAS ----------
export const filas_campo: {
  sessoes: FieldSession[];
  servico: FieldService;
  s_atendentes: number;
  atendentes_por_canal: { balcao: number; totem: number };
} = {
  sessoes: [
    { id: 'S1', data: '2026-06-11', dia: 'Quinta', periodo: 'Pico Jantar',
      n: 20, duracao_min: 52, lambda_min: 0.365, lambda_hora: 21.9, cv: 0.96, s_atendentes: 2 },
    { id: 'S2', data: '2026-06-14', dia: 'Domingo', periodo: 'Vale Tarde/Jantar',
      n: 40, duracao_min: 169, lambda_min: 0.231, lambda_hora: 13.8, cv: 0.94, s_atendentes: 2 },
    { id: 'S3', data: '2026-06-17', dia: 'Quarta', periodo: 'Pico Jantar',
      n: 19, duracao_min: 46, lambda_min: 0.391, lambda_hora: 23.5, cv: 0.79, s_atendentes: 4 },
  ],
  servico: { n: 79, media_min: 7.898, mu_hora: 7.597, cv: 0.365 },
  s_atendentes: 3,
  // Contagem real observada no Salvador Shopping (distinta da loja-piloto sintética
  // usada para calibração de CV/tempo de serviço, que tem 2 balcão / 4 totem).
  atendentes_por_canal: { balcao: 4, totem: 5 },
};

export const lambda_campo_media = 19.7; // /h

export const filas_sintetico: {
  resumo_canais: { balcao: SyntheticChannel; totem: SyntheticChannel; drive: SyntheticChannel };
  volume_hora: HourVolume[];
} = {
  resumo_canais: {
    balcao: { n: 5463, tempo_medio_servico: 1.729, cv_servico: 1.074, atendentes_efetivos: 2 },
    totem:  { n: 4462, tempo_medio_servico: 1.741, cv_servico: 1.205, atendentes_efetivos: 4 },
    drive:  { n: 6351, tempo_medio_servico: 3.665, cv_servico: 0.698, atendentes_efetivos: 1 },
  },
  volume_hora: [
    { hora: 10, balcao: 25.0, totem: 19.3 },
    { hora: 11, balcao: 79.6, totem: 74.1 },
    { hora: 12, balcao: 81.9, totem: 69.1 },
    { hora: 13, balcao: 82.6, totem: 65.3 },
    { hora: 14, balcao: 84.3, totem: 67.6 },
    { hora: 15, balcao: 20.4, totem: 18.9 },
    { hora: 16, balcao: 20.7, totem: 17.7 },
    { hora: 17, balcao: 21.9, totem: 21.3 },
    { hora: 18, balcao: 71.0, totem: 52.9 },
    { hora: 19, balcao: 92.4, totem: 72.0 },
    { hora: 20, balcao: 68.1, totem: 55.0 },
    { hora: 21, balcao: 71.3, totem: 56.9 },
    { hora: 22, balcao: 29.1, totem: 22.4 },
    { hora: 23, balcao: 32.1, totem: 25.0 },
  ],
};

// ---------- PERT ----------
// 22 atividades. Caminho crítico: A B G H M Q R S T U V
const CRITICAL = new Set(['A','B','G','H','M','Q','R','S','T','U','V']);
function pertRow(
  codigo: string, descricao: string, predecessoras: string[],
  o: number, m: number, p: number,
  es: number, ls: number,
  duracao_min_dias: number, custo_crash_dia: number,
): PertActivity {
  const te = +((o + 4*m + p) / 6).toFixed(3);
  const variancia = +(Math.pow((p - o)/6, 2)).toFixed(3);
  const ef = +(es + te).toFixed(3);
  const lf = +(ls + te).toFixed(3);
  const folga = +(ls - es).toFixed(3);
  return {
    codigo, descricao, predecessoras, o, m, p, te, variancia,
    es, ef, ls, lf, folga,
    critica: CRITICAL.has(codigo),
    duracao_min_dias, custo_crash_dia,
  };
}

// McLanche Acarajé — lançamento regional. Caminho crítico: A-B-G-H-M-Q-R-S-T-U-V
// ES/LS informados diretamente (batem com o CPM completo do relatório); duracao_min_dias
// e custo_crash_dia calibrados para reproduzir a sequência de crashing de 24 iterações.
export const pert_atividades: PertActivity[] = [
  pertRow('A', 'Definição do produto e ficha técnica',        [],              5,  7,  12,  0.00,  0.00,  4.50, 2000.00),
  pertRow('B', 'Aprovação corporativa do produto',             ['A'],           8, 10,  15,  7.50,  7.50,  8.50, 1500.00),
  pertRow('C', 'Sourcing do fornecedor de acarajé/vatapá',     ['A'],          10, 14,  22,  7.50, 17.83, 14.67, 0),
  pertRow('D', 'Testes de degustação interna',                 ['A'],           4,  6,   9,  7.50, 36.98,  6.17, 0),
  pertRow('E', 'Definição de preço e margem',                  ['B','D'],       3,  4,   6, 18.00, 43.15,  4.17, 0),
  pertRow('F', 'Negociação contrato fornecedor',                ['C'],           5,  8,  13, 22.17, 32.50,  8.33, 0),
  pertRow('G', 'Compra de equipamento adicional (fritadeira)', ['B'],           7, 12,  20, 18.00, 18.00, 11.50, 3750.00),
  pertRow('H', 'Adaptação física da cozinha',                  ['G'],           8, 10,  14, 30.50, 30.50,  7.33, 3333.33),
  pertRow('I', 'Compra de embalagens customizadas',            ['E'],           6,  9,  14, 22.17, 58.83,  9.33, 0),
  pertRow('J', 'Treinamento técnico dos cozinheiros',          ['F','H'],       6,  8,  12, 40.83, 48.33,  8.33, 0),
  pertRow('K', 'Treinamento do balcão (totem, pedidos)',       ['E'],           3,  5,   8, 22.17, 48.32,  5.17, 0),
  pertRow('L', 'Adaptação PDV / cardápio digital',             ['E'],           4,  6,   9, 22.17, 47.32,  6.17, 0),
  pertRow('M', 'Validação sanitária ANVISA estadual',          ['F','H'],      10, 15,  25, 40.83, 40.83,  9.83, 1333.33),
  pertRow('N', 'Produção dos materiais de marketing',          ['E'],           8, 11,  16, 22.17, 52.66, 11.33, 0),
  pertRow('O', 'Distribuição dos materiais nas lojas',         ['N'],           3,  4,   6, 33.50, 63.99,  4.17, 0),
  pertRow('P', 'Treinamento gerentes (storytelling)',          ['K','L'],       2,  3,   5, 28.34, 53.49,  3.17, 0),
  pertRow('Q', 'Testes operacionais piloto (1 loja)',          ['J','M','P'],   4,  6,  10, 56.66, 56.66,  3.33, 2000.00),
  pertRow('R', 'Ajustes pós-piloto',                            ['Q'],           3,  5,   8, 62.99, 62.99,  3.17, 2250.00),
  pertRow('S', 'Pré-lançamento (soft opening)',                 ['R','I','O'],   2,  3,   5, 68.16, 68.16,  2.17, 3500.00),
  pertRow('T', 'Análise de feedback soft opening',              ['S'],           2,  3,   4, 71.33, 71.33,  2.00, 1500.00),
  pertRow('U', 'Ajustes finais',                                 ['T'],           2,  4,   7, 74.33, 74.33,  2.17, 1500.00),
  pertRow('V', 'Lançamento oficial (Dia D)',                     ['U'],           1,  1,   2, 78.50, 78.50,  1.17, 10000.00),
];

export const pert_meta = {
  duracao_total: 79.67,
  variancia_cp: 17.443,
  desvio_padrao_cp: 4.176,
  caminho_critico: ['A','B','G','H','M','Q','R','S','T','U','V'],
  crashing_alvo: {
    orcamento: 50000,
    gasto_esperado: 49249.97,
    duracao_final: 55.67,
    iteracoes: 24,
  },
};

// ---------- ESTOQUES (15 SKUs) ----------
export const skus: SKU[] = [
  { codigo: 'SKU-001', descricao: 'Hambúrguer 90/10 (cx 100un)',       D_anual: 1820, S_pedido: 25,  H_unit_ano: 22,   validade_dias: 5,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-002', descricao: 'Hambúrguer quarteirão (cx 60un)',   D_anual: 950,  S_pedido: 22,  H_unit_ano: 28,   validade_dias: 5,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-003', descricao: 'Pão Big Mac (pct 24un)',            D_anual: 2400, S_pedido: 18,  H_unit_ano: 18,   validade_dias: 7,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-004', descricao: 'Pão brioche premium (pct 24un)',    D_anual: 850,  S_pedido: 15,  H_unit_ano: 16,   validade_dias: 5,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-005', descricao: 'Pão padrão (pct 24un)',             D_anual: 3200, S_pedido: 18,  H_unit_ano: 15,   validade_dias: 7,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-006', descricao: 'Queijo cheddar fatiado (pct 1kg)',  D_anual: 1450, S_pedido: 60,  H_unit_ano: 12,   validade_dias: 30,  categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão Periódica' },
  { codigo: 'SKU-007', descricao: 'Bacon fatiado (pct 500g)',          D_anual: 780,  S_pedido: 80,  H_unit_ano: 14,   validade_dias: 21,  categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão Periódica' },
  { codigo: 'SKU-008', descricao: 'Alface americana (cx 5kg)',         D_anual: 950,  S_pedido: 12,  H_unit_ano: 18,   validade_dias: 4,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-009', descricao: 'Tomate italiano (cx 5kg)',          D_anual: 720,  S_pedido: 12,  H_unit_ano: 15,   validade_dias: 4,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-010', descricao: 'Cebola roxa fatiada (kg)',          D_anual: 480,  S_pedido: 40,  H_unit_ano: 14,   validade_dias: 7,   categoria: 'PERIODO_FIXO',     abordagem: 'Período Fixo' },
  { codigo: 'SKU-011', descricao: 'Batata pré-frita McCain (cx 6×2,5kg)', D_anual: 2200, S_pedido: 220, H_unit_ano: 15, validade_dias: 90, categoria: 'EOQ_CLASSICO',    abordagem: 'EOQ Clássico' },
  { codigo: 'SKU-012', descricao: 'Big Mac sauce (galão 4L)',          D_anual: 96,   S_pedido: 380, H_unit_ano: 22,   validade_dias: 60,  categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão Periódica' },
  { codigo: 'SKU-013', descricao: 'Ketchup (galão 4L)',                D_anual: 240,  S_pedido: 80,  H_unit_ano: 5.5,  validade_dias: 180, categoria: 'EOQ_CLASSICO',    abordagem: 'EOQ Clássico' },
  { codigo: 'SKU-014', descricao: 'Mostarda amarela (galão 4L)',       D_anual: 180,  S_pedido: 80,  H_unit_ano: 5,    validade_dias: 180, categoria: 'EOQ_CLASSICO',    abordagem: 'EOQ Clássico' },
  { codigo: 'SKU-015', descricao: 'Picles (balde 5L)',                 D_anual: 200,  S_pedido: 80,  H_unit_ano: 6.5,  validade_dias: 90,  categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão Periódica' },
];

// ---------- JOGOS ----------
export const jogos_cenarios: GameScenario[] = [
  {
    id: 'A',
    titulo: 'McDonald\'s × Burger King',
    tipo: 'Dilema do Prisioneiro — promoção semanal de combos',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Burger King',
    estrategias_linha: ['Promoção', 'Preço cheio'],
    estrategias_coluna: ['Promoção', 'Preço cheio'],
    // (Promoção,Promoção)=(45,38) ★ NASH; (Promoção,Cheio)=(95,25); (Cheio,Promoção)=(28,88); (Cheio,Cheio)=(75,65)
    matrix: [
      [[45, 38], [95, 25]],
      [[28, 88], [75, 65]],
    ],
    leitura: 'Nash em (Promoção, Promoção) = (45, 38): dado que o rival promove, cada um prefere também promover (45>28 para o McD; 38>25 para o BK). Dilema clássico — (Preço cheio, Preço cheio)=(75,65) seria melhor para ambos, mas é instável.',
  },
  {
    id: 'B',
    titulo: 'McDonald\'s × Madero',
    tipo: 'Dominância estrita — posicionamento de preço',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Madero',
    estrategias_linha: ['Lançar premium R$35', 'Manter linha R$22'],
    estrategias_coluna: ['Preço alto R$45', 'Desconto R$35'],
    // (Premium,Alto)=(62,78); (Premium,Desc)=(38,95); (Manter,Alto)=(85,68); (Manter,Desc)=(72,82) ★ NASH
    matrix: [
      [[62, 78], [38, 95]],
      [[85, 68], [72, 82]],
    ],
    leitura: 'Divergência com o gabarito do professor (que sugeria "sem Nash puro"). Por dominância estrita: McD "Manter R$22" domina "Premium" (85>62 e 72>38); Madero "Desconto R$35" domina "Preço alto" (95>78 e 82>68). IEDS leva a um Nash puro único: (Manter R$22, Desconto R$35) = (72, 82).',
  },
  {
    id: 'C',
    titulo: 'McDonald\'s × Subway',
    tipo: 'Jogo de coordenação — expansão do café da manhã',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Subway',
    estrategias_linha: ['Investir forte', 'Manter atual'],
    estrategias_coluna: ['Investir forte', 'Manter atual'],
    // (Investir,Investir)=(35,32); (Investir,Manter)=(78,18) ★ NASH 1; (Manter,Investir)=(15,85) ★ NASH 2; (Manter,Manter)=(52,50)
    matrix: [
      [[35, 32], [78, 18]],
      [[15, 85], [52, 50]],
    ],
    leitura: 'O relatório aponta dois Nash puros — (Investir, Manter) e (Manter, Investir) — com first-mover advantage no café da manhã (6h–10h). Divergência: com esta matriz, Investir é dominante para os dois jogadores (ver análise crítica abaixo), e o Nash puro matemático é único: (Investir, Investir) = (35, 32).',
  },
];

export const PROJECT_DATA = {
  filas_campo,
  filas_sintetico,
  lambda_campo_media,
  pert_atividades,
  pert_meta,
  skus,
  jogos_cenarios,
};

export type ProjectData = typeof PROJECT_DATA;
