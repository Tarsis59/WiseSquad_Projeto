import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { agentConfigs, normalizeRecord } from "@/lib/generate";
import type { AgentType, GeneratedRecord } from "@/lib/types";
import { ThemeDetailContent } from "@/components/dashboard/theme-detail-content";

interface ThemeDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchThemeDetail(id: string) {
  // Tenta buscar o tema por ID (pode ser UUID ou integer)
  const { data: tema, error: temaError } = await supabase
    .from("temas")
    .select("id, titulo, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (temaError || !tema) {
    console.error(`[ThemeDetail] Erro ao buscar tema ${id}:`, temaError);
    return null;
  }

  const outputs: Record<string, GeneratedRecord[]> = {};
  const agents = Object.keys(agentConfigs) as AgentType[];
  
  // Prepara busca por ID numérico também, se aplicável
  const numericId = !isNaN(Number(id)) ? Number(id) : null;

  await Promise.all(
    agents.map(async (agent) => {
      const config = agentConfigs[agent];
      
      // 1. Tentar buscar pelo tema_id (forma correta)
      // Buscamos usando o ID original e o numérico (se houver) para garantir compatibilidade
      const query = supabase
        .from(config.table)
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

      if (numericId !== null) {
        query.or(`tema_id.eq.${id},tema_id.eq.${numericId}`);
      } else {
        query.eq("tema_id", id);
      }

      const { data: byId, error: errorId } = await query;

      let record: GeneratedRecord | null = null;

      if (byId && byId.length > 0) {
        record = normalizeRecord(agent, byId[0] as Record<string, unknown>);
      } else {
        // 2. Fallback: buscar pelo título exato (cura automática)
        const { data: byTitle } = await supabase
          .from(config.table)
          .select("*")
          .eq("titulo", tema.titulo)
          .order("id", { ascending: false })
          .limit(1);
        
        if (byTitle && byTitle.length > 0) {
          record = normalizeRecord(agent, byTitle[0] as Record<string, unknown>);
          // Cura: vincula ao ID correto para as próximas consultas
          console.log(`[wisesquad.heal] Vinculando conteúdo órfão de ${agent} ao tema ID ${id} pelo título.`);
          await supabase.from(config.table).update({ tema_id: id }).eq("id", byTitle[0].id);
        }
      }

      if (record) {
        outputs[agent] = [record];
      }
    })
  );

  return { tema, outputs };
}


export default async function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  const { id } = await params;
  const data = await fetchThemeDetail(id);

  if (!data) {
    notFound();
  }

  return <ThemeDetailContent initialTema={data.tema} initialOutputs={data.outputs} />;
}

