export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          autor: string
          cliente: string
          created_at: string
          headline: string
          id: string
          industry: string
          initial: string
          local: string
          periodo: string
          resumo: string
          short: string
          sort_order: number
          theme: string
          updated_at: string
          version: string
        }
        Insert: {
          autor: string
          cliente: string
          created_at?: string
          headline: string
          id: string
          industry: string
          initial: string
          local: string
          periodo: string
          resumo: string
          short: string
          sort_order?: number
          theme: string
          updated_at?: string
          version: string
        }
        Update: {
          autor?: string
          cliente?: string
          created_at?: string
          headline?: string
          id?: string
          industry?: string
          initial?: string
          local?: string
          periodo?: string
          resumo?: string
          short?: string
          sort_order?: number
          theme?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      estoque_config: {
        Row: {
          client_id: string
          selected_sku: string
        }
        Insert: {
          client_id: string
          selected_sku: string
        }
        Update: {
          client_id?: string
          selected_sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_skus: {
        Row: {
          categoria: string
          client_id: string
          codigo: string
          d_anual: number
          descricao: string
          h_unit_ano: number
          id: string
          s_pedido: number
          sort_order: number
          validade_dias: number
        }
        Insert: {
          categoria: string
          client_id: string
          codigo: string
          d_anual: number
          descricao: string
          h_unit_ano: number
          id?: string
          s_pedido: number
          sort_order?: number
          validade_dias: number
        }
        Update: {
          categoria?: string
          client_id?: string
          codigo?: string
          d_anual?: number
          descricao?: string
          h_unit_ano?: number
          id?: string
          s_pedido?: number
          sort_order?: number
          validade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_skus_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      filas_canais: {
        Row: {
          client_id: string
          id: string
          key: string
          label: string
          lambda: number
          mu: number
          s: number
          sort_order: number
        }
        Insert: {
          client_id: string
          id?: string
          key: string
          label: string
          lambda: number
          mu: number
          s: number
          sort_order?: number
        }
        Update: {
          client_id?: string
          id?: string
          key?: string
          label?: string
          lambda?: number
          mu?: number
          s?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "filas_canais_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      filas_sim: {
        Row: {
          client_id: string
          lambda: number
          pool_lambda: number | null
          pool_mu: number | null
          pool_s: number | null
          s: number
          service_min: number
        }
        Insert: {
          client_id: string
          lambda: number
          pool_lambda?: number | null
          pool_mu?: number | null
          pool_s?: number | null
          s: number
          service_min: number
        }
        Update: {
          client_id?: string
          lambda?: number
          pool_lambda?: number | null
          pool_mu?: number | null
          pool_s?: number | null
          s?: number
          service_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "filas_sim_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      filas_volume: {
        Row: {
          canal_key: string
          client_id: string
          hora: number
          id: string
          valor: number
        }
        Insert: {
          canal_key: string
          client_id: string
          hora: number
          id?: string
          valor: number
        }
        Update: {
          canal_key?: string
          client_id?: string
          hora?: number
          id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "filas_volume_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jogos_cenarios: {
        Row: {
          cenario_id: string
          client_id: string
          coluna: string
          est_coluna: string[]
          est_linha: string[]
          id: string
          leitura: string
          linha: string
          matrix: Json
          sort_order: number
          tipo: string
          titulo: string
        }
        Insert: {
          cenario_id: string
          client_id: string
          coluna: string
          est_coluna: string[]
          est_linha: string[]
          id?: string
          leitura: string
          linha: string
          matrix: Json
          sort_order?: number
          tipo: string
          titulo: string
        }
        Update: {
          cenario_id?: string
          client_id?: string
          coluna?: string
          est_coluna?: string[]
          est_linha?: string[]
          id?: string
          leitura?: string
          linha?: string
          matrix?: Json
          sort_order?: number
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "jogos_cenarios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jogos_config: {
        Row: {
          client_id: string
          precos_campo_label: string | null
          precos_campo_players: string[] | null
          selected_index: number
        }
        Insert: {
          client_id: string
          precos_campo_label?: string | null
          precos_campo_players?: string[] | null
          selected_index?: number
        }
        Update: {
          client_id?: string
          precos_campo_label?: string | null
          precos_campo_players?: string[] | null
          selected_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "jogos_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jogos_precos_campo: {
        Row: {
          categoria: string
          client_id: string
          id: string
          precos: Json
          sort_order: number
        }
        Insert: {
          categoria: string
          client_id: string
          id?: string
          precos: Json
          sort_order?: number
        }
        Update: {
          categoria?: string
          client_id?: string
          id?: string
          precos?: Json
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "jogos_precos_campo_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pert_atividades: {
        Row: {
          client_id: string
          codigo: string
          crash_cost: number
          descricao: string
          es: number
          floor: number | null
          id: string
          ls: number
          m: number
          o: number
          p: number
          predecessoras: string[]
          sort_order: number
        }
        Insert: {
          client_id: string
          codigo: string
          crash_cost?: number
          descricao: string
          es: number
          floor?: number | null
          id?: string
          ls: number
          m: number
          o: number
          p: number
          predecessoras?: string[]
          sort_order?: number
        }
        Update: {
          client_id?: string
          codigo?: string
          crash_cost?: number
          descricao?: string
          es?: number
          floor?: number | null
          id?: string
          ls?: number
          m?: number
          o?: number
          p?: number
          predecessoras?: string[]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pert_atividades_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pert_config: {
        Row: {
          budget: number
          client_id: string
          deadline: number
        }
        Insert: {
          budget: number
          client_id: string
          deadline: number
        }
        Update: {
          budget?: number
          client_id?: string
          deadline?: number
        }
        Relationships: [
          {
            foreignKeyName: "pert_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recomendacoes: {
        Row: {
          accent: string
          client_id: string
          corpo: string
          frente: string
          id: string
          impacto_lbl: string
          impacto_num: string
          tag: string
          titulo: string
        }
        Insert: {
          accent: string
          client_id: string
          corpo: string
          frente: string
          id?: string
          impacto_lbl: string
          impacto_num: string
          tag: string
          titulo: string
        }
        Update: {
          accent?: string
          client_id?: string
          corpo?: string
          frente?: string
          id?: string
          impacto_lbl?: string
          impacto_num?: string
          tag?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendacoes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
