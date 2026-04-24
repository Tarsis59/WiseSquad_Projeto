export type AgentType = "blog" | "linkedin" | "youtube" | "reels" | "shorts" | "substack" | string;

export interface Tema {
  id: string;
  titulo: string;
  status?: string | null;
  completed_count?: number;
  total_count?: number;
}

export interface GeneratedRecord {
  id: string;
  tema_id: string;
  titulo: string;
  conteudo: string;
  imagem_url?: string | null;
  thumbnail_url?: string | null;
  media_url?: string | null;
  created_at?: string | null;
  agent: AgentType;
}

export interface CustomAgent {
  id: string;
  nome: string;
  prompt_sistema: string;
}

export interface CustomOutput {
  id: string;
  tema_id: string;
  agent_id: string;
  titulo: string;
  conteudo: string;
  created_at?: string | null;
}
