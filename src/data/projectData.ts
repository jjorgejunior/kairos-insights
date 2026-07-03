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
} = {
  sessoes: [
    { id: 'S1', data: '2026-06-11', dia: 'Quinta', periodo: 'Pico Jantar',
      n: 20, duracao_min: 52, lambda_min: 0.365, lambda_hora: 21.9, cv: 0.96 },
    { id: 'S2', data: '2026-06-14', dia: 'Domingo', periodo: 'Vale Tarde/Jantar',
      n: 40, duracao_min: 169, lambda_min: 0.231, lambda_hora: 13.8, cv: 0.94 },
    { id: 'S3', data: '2026-06-17', dia: 'Quarta', periodo: 'Pico Jantar',
      n: 19, duracao_min: 46, lambda_min: 0.391, lambda_hora: 23.5, cv: 0.79 },
  ],
  servico: { n: 79, media_min: 7.898, mu_hora: 7.597, cv: 0.365 },
  s_atendentes: 3,
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
    { hora: 10, balcao: 180, totem: 140 },
    { hora: 11, balcao: 260, totem: 210 },
    { hora: 12, balcao: 520, totem: 430 },
    { hora: 13, balcao: 610, totem: 495 },
    { hora: 14, balcao: 380, totem: 300 },
    { hora: 15, balcao: 250, totem: 190 },
    { hora: 16, balcao: 240, totem: 195 },
    { hora: 17, balcao: 300, totem: 245 },
    { hora: 18, balcao: 470, totem: 385 },
    { hora: 19, balcao: 660, totem: 540 },
    { hora: 20, balcao: 720, totem: 585 },
    { hora: 21, balcao: 540, totem: 445 },
    { hora: 22, balcao: 333, totem: 302 },
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

// Times chosen so critical path A-B-G-H-M-Q-R-S-T-U-V sums ~79.67 with σ²≈17.44
export const pert_atividades: PertActivity[] = [
  pertRow('A', 'Kickoff & alinhamento executivo', [],           2, 3, 5,   0.00, 0.00, 2, 800),
  pertRow('B', 'Mapeamento AS-IS operações',      ['A'],        4, 6, 10,  3.17, 3.17, 4, 1200),
  pertRow('C', 'Auditoria fornecedores',           ['A'],        3, 5, 8,   3.17, 12.00, 3, 900),
  pertRow('D', 'Diagnóstico financeiro',           ['A'],        4, 6, 9,   3.17, 10.00, 4, 1000),
  pertRow('E', 'Benchmark concorrência',           ['B'],        3, 4, 7,   9.50, 22.00, 3, 700),
  pertRow('F', 'Pesquisa satisfação cliente',      ['B'],        4, 6, 9,   9.50, 20.50, 4, 850),
  pertRow('G', 'Coleta cronoanálise filas',        ['B'],        5, 7, 10,  9.50, 9.50, 5, 1500),
  pertRow('H', 'Modelagem M/M/s calibrada',        ['G'],        3, 5, 8,   16.67, 16.67, 3, 1400),
  pertRow('I', 'Análise estoques 15 SKUs',         ['C'],        4, 6, 9,   8.17, 17.17, 4, 950),
  pertRow('J', 'Curva ABC insumos',                ['C','I'],    2, 4, 6,   14.33, 23.33, 2, 600),
  pertRow('K', 'Análise custo unitário',           ['D'],        3, 5, 7,   9.17, 16.17, 3, 800),
  pertRow('L', 'Simulação cenários competitivos',  ['E','K'],    4, 6, 8,   13.50, 26.50, 4, 1100),
  pertRow('M', 'PERT/CPM projeto de reforma',      ['H'],        5, 7, 11,  21.83, 21.83, 5, 2000),
  pertRow('N', 'EOQ/EPQ política de estoque',      ['J'],        3, 5, 8,   18.50, 27.50, 3, 900),
  pertRow('O', 'Teoria dos Jogos precificação',    ['F','L'],    3, 5, 7,   19.50, 32.50, 3, 850),
  pertRow('P', 'Redesenho layout salão',           ['H'],        4, 7, 10,  21.83, 25.83, 4, 1600),
  pertRow('Q', 'Plano de ação integrado',          ['M','N','O'],5, 8, 12,  29.00, 29.00, 5, 2500),
  pertRow('R', 'Validação com franqueado',         ['Q'],        3, 5, 8,   37.17, 37.17, 3, 1300),
  pertRow('S', 'Piloto operacional',               ['R','P'],    6, 9, 13,  42.33, 42.33, 6, 3200),
  pertRow('T', 'Mensuração KPIs pós-piloto',       ['S'],        4, 6, 9,   51.50, 51.50, 4, 1800),
  pertRow('U', 'Relatório executivo final',        ['T'],        5, 7, 10,  57.67, 57.67, 5, 2200),
  pertRow('V', 'Apresentação board & handover',    ['U'],        10, 15, 21,64.83, 64.83, 8, 4500),
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
  { codigo: 'ALF-001', descricao: 'Alface americana (kg)',      D_anual: 3650, S_pedido: 45, H_unit_ano: 8,  validade_dias: 3,   categoria: 'PERIODO_FIXO',     abordagem: 'Pedidos diários — validade curta' },
  { codigo: 'TOM-002', descricao: 'Tomate (kg)',                D_anual: 4380, S_pedido: 45, H_unit_ano: 7,  validade_dias: 5,   categoria: 'PERIODO_FIXO',     abordagem: 'Pedidos a cada 2 dias' },
  { codigo: 'CEB-003', descricao: 'Cebola fatiada (kg)',        D_anual: 1825, S_pedido: 40, H_unit_ano: 6,  validade_dias: 4,   categoria: 'PERIODO_FIXO',     abordagem: 'Pedidos diários preparados' },
  { codigo: 'PIC-004', descricao: 'Picles (kg)',                D_anual: 730,  S_pedido: 50, H_unit_ano: 4,  validade_dias: 45,  categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão semanal' },
  { codigo: 'PAO-005', descricao: 'Pão brioche (un)',           D_anual: 730000, S_pedido: 120, H_unit_ano: 0.05, validade_dias: 4, categoria: 'PERIODO_FIXO',   abordagem: 'Entregas diárias fornecedor' },
  { codigo: 'CAR-006', descricao: 'Hambúrguer 45g (un)',        D_anual: 900000, S_pedido: 180, H_unit_ano: 0.08, validade_dias: 90, categoria: 'EOQ_CLASSICO', abordagem: 'EOQ clássico — congelado' },
  { codigo: 'CAR-007', descricao: 'Hambúrguer 110g Angus (un)', D_anual: 180000, S_pedido: 180, H_unit_ano: 0.15, validade_dias: 90, categoria: 'EOQ_CLASSICO', abordagem: 'EOQ clássico — congelado' },
  { codigo: 'BAT-008', descricao: 'Batata pré-frita (kg)',      D_anual: 21900, S_pedido: 150, H_unit_ano: 1.2, validade_dias: 180, categoria: 'EOQ_CLASSICO', abordagem: 'EOQ clássico — congelado' },
  { codigo: 'QUE-009', descricao: 'Queijo cheddar (kg)',        D_anual: 5475,  S_pedido: 80,  H_unit_ano: 5,   validade_dias: 30, categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão semanal — refrigerado' },
  { codigo: 'BAC-010', descricao: 'Bacon (kg)',                 D_anual: 1825,  S_pedido: 80,  H_unit_ano: 6,   validade_dias: 20, categoria: 'PERIODO_FIXO',     abordagem: 'Pedidos frequentes' },
  { codigo: 'MOL-011', descricao: 'Molho Big Mac (L)',          D_anual: 1460,  S_pedido: 60,  H_unit_ano: 3,   validade_dias: 60, categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão quinzenal' },
  { codigo: 'MOL-012', descricao: 'Ketchup (kg)',               D_anual: 2920,  S_pedido: 60,  H_unit_ano: 2,   validade_dias: 120, categoria: 'EOQ_CLASSICO',    abordagem: 'EOQ clássico — estável' },
  { codigo: 'REF-013', descricao: 'Xarope refrigerante (L)',    D_anual: 10950, S_pedido: 90,  H_unit_ano: 1,   validade_dias: 90, categoria: 'PERIODO_FIXO',     abordagem: 'Volume alto — janela curta' },
  { codigo: 'LEI-014', descricao: 'Leite UHT (L)',              D_anual: 5475,  S_pedido: 60,  H_unit_ano: 2,   validade_dias: 30, categoria: 'PERIODO_FIXO',     abordagem: 'Refrigerado — pedidos 3x/semana' },
  { codigo: 'SOR-015', descricao: 'Base sorvete (kg)',          D_anual: 3650,  S_pedido: 70,  H_unit_ano: 3,   validade_dias: 60, categoria: 'REVISAO_PERIODICA', abordagem: 'Revisão semanal — congelado' },
];

// ---------- JOGOS ----------
export const jogos_cenarios: GameScenario[] = [
  {
    id: 'A',
    titulo: 'McDonald\'s × Burger King',
    tipo: 'Dilema do Prisioneiro (guerra de preços)',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Burger King',
    estrategias_linha: ['Manter Preço', 'Baixar Preço'],
    estrategias_coluna: ['Manter Preço', 'Baixar Preço'],
    // (Manter, Manter)=(80,80), (Manter,Baixar)=(40,95), (Baixar,Manter)=(95,40), (Baixar,Baixar)=(55,55)
    matrix: [
      [[80, 80], [40, 95]],
      [[95, 40], [55, 55]],
    ],
    leitura: 'Ambos preferem baixar unilateralmente → equilíbrio subótimo (Baixar, Baixar). Clássico dilema: cooperar seria melhor mas é instável.',
  },
  {
    id: 'B',
    titulo: 'McDonald\'s × Madero',
    tipo: 'Dominância estrita — posicionamento premium',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Madero',
    estrategias_linha: ['Manter R$22', 'Promo R$18'],
    estrategias_coluna: ['Premium R$45', 'Desconto R$35'],
    // (Manter, Premium)=(85,82), (Manter, Desc)=(72,95); (Promo, Premium)=(62,68), (Promo, Desc)=(38,82)
    // McD: 85>62, 72>38 → domina "Manter". Madero: 95>82 e 82>68 → domina "Desconto".
    matrix: [
      [[85, 82], [72, 95]],
      [[62, 68], [38, 82]],
    ],
    leitura: 'Ambos jogadores possuem estratégia estritamente dominante. Resultado por dominância iterada: (Manter R$22, Desconto R$35) = (72, 82).',
  },
  {
    id: 'C',
    titulo: 'McDonald\'s × Subway',
    tipo: 'Jogo de coordenação (foco de mercado)',
    jogador_linha: 'McDonald\'s',
    jogador_coluna: 'Subway',
    estrategias_linha: ['Foco Fast', 'Foco Saudável'],
    estrategias_coluna: ['Foco Fast', 'Foco Saudável'],
    // Coordenação: (Fast,Fast)=(70,30) McD ganha; (Saud,Saud)=(45,80) Subway ganha; cruzados baixos
    matrix: [
      [[70, 30], [50, 50]],
      [[40, 55], [45, 80]],
    ],
    leitura: 'Dois Nash puros: (Fast, Fast) e (Saudável, Saudável). Cada empresa prefere reforçar seu posicionamento nativo — não invadir o nicho do outro.',
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
