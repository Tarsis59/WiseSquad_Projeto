import { NextResponse } from "next/server";

import { generateImageWithNanoBanana, buildPollinationsUrl } from "@/lib/generate";
import { supabase } from "@/lib/supabase";
import { agentConfigs } from "@/lib/generate";
import type { AgentType } from "@/lib/types";

export const dynamic = "force-dynamic";

const validAgents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "substack"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      agent?: AgentType;
      temaId?: string;
    };

    const agent = body.agent;
    const temaId = body.temaId;

    if (!agent || !validAgents.includes(agent)) {
      return NextResponse.json({ success: false, message: "Agente inválido." }, { status: 400 });
    }

    if (!temaId) {
      return NextResponse.json({ success: false, message: "ID do tema é obrigatório." }, { status: 400 });
    }

    const config = agentConfigs[agent];
    if (!config) {
      return NextResponse.json({ success: false, message: "Configuração do agente não encontrada." }, { status: 400 });
    }

    // Buscar o registro existente
    const { data: row, error: fetchError } = await supabase
      .from(config.table)
      .select("id, titulo")
      .eq("tema_id", temaId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ success: false, message: "Conteúdo não encontrado. Gere o texto primeiro." }, { status: 404 });
    }

    // Gerar imagem com Nano Banana
    const aspectRatioMap: Record<AgentType, string> = {
      blog: "2:1", linkedin: "2:1", youtube: "16:9",
      reels: "9:16", shorts: "9:16", substack: "2:1",
    };

    const promptMap: Record<AgentType, string> = {
      blog: `professional blog header image about "${row.titulo}", corporate modern style, clean typography, soft gradient background, no text`,
      linkedin: `professional linkedin social media post image about "${row.titulo}", corporate modern style, people working with technology, clean design, no text`,
      youtube: `youtube thumbnail about "${row.titulo}", bold colors, high contrast, modern marketing digital style, professional, no text overlays, 16:9`,
      reels: `instagram reels cover about "${row.titulo}", vibrant vertical social media style, bold modern colors, professional, no text`,
      shorts: `youtube shorts thumbnail about "${row.titulo}", dynamic minimalist style, bold colors, vertical composition, no text`,
      substack: `editorial newsletter header about "${row.titulo}", minimalist corporate design, elegant typography, soft background, no text`,
    };

    const nanoUrl = await generateImageWithNanoBanana(promptMap[agent], aspectRatioMap[agent]);
    const imageUrl = nanoUrl || buildPollinationsUrl(promptMap[agent], agent === "youtube" ? 1280 : 640, agent === "youtube" ? 720 : 320);

    // Atualizar no banco
    const updateField = agent === "youtube" ? { thumbnail_url: imageUrl } : { imagem_url: imageUrl };
    const { error: updateError } = await supabase.from(config.table).update(updateField).eq("id", row.id);

    if (updateError) {
      return NextResponse.json({ success: false, message: "Erro ao salvar imagem no banco." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Imagem gerada com sucesso!",
    });
  } catch (error) {
    console.error("[api/generate-image] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno ao gerar imagem.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get("agent") as AgentType;
    const recordId = searchParams.get("recordId");

    if (!agent || !validAgents.includes(agent) || !recordId) {
      return NextResponse.json({ success: false, message: "Parâmetros inválidos." }, { status: 400 });
    }

    const config = agentConfigs[agent];
    const updateFields = agent === "youtube" 
      ? { thumbnail_url: null } 
      : { imagem_url: null, media_url: null };

    const { error } = await supabase
      .from(config.table)
      .update(updateFields)
      .eq("id", recordId);

    if (error) {
      return NextResponse.json({ success: false, message: "Erro ao remover imagem." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Imagem removida com sucesso." });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erro interno." }, { status: 500 });
  }
}
