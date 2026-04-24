import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { agentConfigs } from "@/lib/generate";
import type { AgentType } from "@/lib/types";
import { EditContentClient } from "@/components/dashboard/edit-content-client";

const agentLabels: Record<string, string> = {
  blog: "Blog",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  reels: "Reels",
  shorts: "Shorts",
  substack: "Substack",
};

async function fetchContent(agent: AgentType, id: string) {
  const config = agentConfigs[agent];
  if (!config) return null;

  const { data, error } = await supabase
    .from(config.table)
    .select("id, tema_id, titulo, conteudo, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export default async function EditContentPage({ params }: { params: Promise<{ agent: string; id: string }> }) {
  const { agent, id } = await params;
  const data = await fetchContent(agent as AgentType, id);

  if (!data) {
    notFound();
  }

  const label = agentLabels[agent] ?? agent;
  const conteudo = typeof data.conteudo === "string" ? data.conteudo : "";
  const titulo = typeof data.titulo === "string" ? data.titulo : "Editar Conteúdo";
  const temaId = typeof data.tema_id === "string" ? data.tema_id : "";

  return (
    <EditContentClient
      agent={agent}
      recordId={id}
      initialContent={conteudo}
      temaId={temaId}
      titulo={titulo}
      label={label}
    />
  );
}
