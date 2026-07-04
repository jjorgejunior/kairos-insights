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
          id: string
          cliente: string
          short: string
          local: string
          initial: string
          industry: string
          periodo: string
          autor: string
          version: string
          theme: string
          headline: string
          resumo: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          cliente: string
          short: string
          local: string
          initial: string
          industry: string
          periodo: string
          autor: string
          version: string
          theme: string
          headline: string
          resumo: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente?: string
          short?: string
          local?: string
          initial?: string
          industry?: string
          periodo?: string
          autor?: string
          version?: string
          theme?: string
          headline?: string
          resumo?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recomendacoes: {
        Row: {
          id: string
          client_id: string
          frente: string
          tag: string
          accent: string
          titulo: string
          corpo: string
          impacto_num: string
          impacto_lbl: string
        }
        Insert: {
          id?: string
          client_id: string
          frente: string
          tag: string
          accent: string
          titulo: string
          corpo: string
          impacto_num: string
          impacto_lbl: string
        }
        Update: {
          id?: string
          client_id?: string
          frente?: string
          tag?: string
          accent?: string
          titulo?: string
          corpo?: string
          impacto_num?: string
          impacto_lbl?: string
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
      filas_canais: {
        Row: {
          id: string
          client_id: string
          key: string
          label: string
          lambda: number
          mu: number
          s: number
          sort_order: number
        }
        Insert: {
          id?: string
          client_id: string
          key: string
          label: string
          lambda: number
          mu: number
          s: number
          sort_order?: number
        }
        Update: {
          id?: string
          client_id?: string
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
      filas_volume: {
        Row: {
          id: string
          client_id: string
          hora: number
          canal_key: string
          valor: number
        }
        Insert: {
          id?: string
          client_id: string
          hora: number
          canal_key: string
          valor: number
        }
        Update: {
          id?: string
          client_id?: string
          hora?: number
          canal_key?: string
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
      filas_sim: {
        Row: {
          client_id: string
          lambda: number
          s: number
          service_min: number
        }
        Insert: {
          client_id: string
          lambda: number
          s: number
          service_min: number
        }
        Update: {
          client_id?: string
          lambda?: number
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
      pert_config: {
        Row: {
          client_id: string
          deadline: number
          budget: number
        }
        Insert: {
          client_id: string
          deadline: number
          budget: number
        }
        Update: {
          client_id?: string
          deadline?: number
          budget?: number
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
      pert_atividades: {
        Row: {
          id: string
          client_id: string
          codigo: string
          descricao: string
          predecessoras: string[]
          o: number
          m: number
          p: number
          es: number
          ls: number
          floor: number | null
          crash_cost: number
          sort_order: number
        }
        Insert: {
          id?: string
          client_id: string
          codigo: string
          descricao: string
          predecessoras?: string[]
          o: number
          m: number
          p: number
          es: number
          ls: number
          floor?: number | null
          crash_cost?: number
          sort_order?: number
        }
        Update: {
          id?: string
          client_id?: string
          codigo?: string
          descricao?: string
          predecessoras?: string[]
          o?: number
          m?: number
          p?: number
          es?: number
          ls?: number
          floor?: number | null
          crash_cost?: number
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
          id: string
          client_id: string
          codigo: string
          descricao: string
          d_anual: number
          s_pedido: number
          h_unit_ano: number
          validade_dias: number
          categoria: string
          sort_order: number
        }
        Insert: {
          id?: string
          client_id: string
          codigo: string
          descricao: string
          d_anual: number
          s_pedido: number
          h_unit_ano: number
          validade_dias: number
          categoria: string
          sort_order?: number
        }
        Update: {
          id?: string
          client_id?: string
          codigo?: string
          descricao?: string
          d_anual?: number
          s_pedido?: number
          h_unit_ano?: number
          validade_dias?: number
          categoria?: string
          sort_order?: number
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
      jogos_config: {
        Row: {
          client_id: string
          selected_index: number
          precos_campo_players: string[] | null
          precos_campo_label: string | null
        }
        Insert: {
          client_id: string
          selected_index?: number
          precos_campo_players?: string[] | null
          precos_campo_label?: string | null
        }
        Update: {
          client_id?: string
          selected_index?: number
          precos_campo_players?: string[] | null
          precos_campo_label?: string | null
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
      jogos_cenarios: {
        Row: {
          id: string
          client_id: string
          cenario_id: string
          titulo: string
          tipo: string
          linha: string
          coluna: string
          est_linha: string[]
          est_coluna: string[]
          matrix: Json
          leitura: string
          sort_order: number
        }
        Insert: {
          id?: string
          client_id: string
          cenario_id: string
          titulo: string
          tipo: string
          linha: string
          coluna: string
          est_linha: string[]
          est_coluna: string[]
          matrix: Json
          leitura: string
          sort_order?: number
        }
        Update: {
          id?: string
          client_id?: string
          cenario_id?: string
          titulo?: string
          tipo?: string
          linha?: string
          coluna?: string
          est_linha?: string[]
          est_coluna?: string[]
          matrix?: Json
          leitura?: string
          sort_order?: number
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
      jogos_precos_campo: {
        Row: {
          id: string
          client_id: string
          categoria: string
          precos: Json
          sort_order: number
        }
        Insert: {
          id?: string
          client_id: string
          categoria: string
          precos: Json
          sort_order?: number
        }
        Update: {
          id?: string
          client_id?: string
          categoria?: string
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
