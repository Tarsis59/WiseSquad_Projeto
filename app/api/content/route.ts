import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { agentConfigs } from "@/lib/generate";
import type { AgentType } from "@/lib/types";

export const dynamic = "force-dynamic";

const validAgents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "tiktok", "substack"];

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      agent?: AgentType;
      recordId?: string;
      conteudo?: string;
      status?: string;
    };

    const agent = body.agent;
    const recordId = body.recordId;
    const conteudo = body.conteudo;

    if (!agent || !validAgents.includes(agent)) {
      return NextResponse.json({ success: false, message: "Agente inválido." }, { status: 400 });
    }

    if (!recordId) {
      return NextResponse.json({ success: false, message: "ID do registro é obrigatório." }, { status: 400 });
    }

    if (!conteudo) {
      return NextResponse.json({ success: false, message: "Conteúdo é obrigatório." }, { status: 400 });
    }

    const config = agentConfigs[agent];
    if (!config) {
      return NextResponse.json({ success: false, message: "Configuração do agente não encontrada." }, { status: 400 });
    }

    let finalConteudo = conteudo;
    if (body.status === "confirmed" && finalConteudo && !finalConteudo.includes("[CONFIRMED]")) {
      finalConteudo = finalConteudo + "\n\n[CONFIRMED]";
    } else if (body.status === "draft" && finalConteudo) {
      finalConteudo = finalConteudo.replace(/\n\n\[CONFIRMED\]/g, "").replace(/\[CONFIRMED\]/g, "");
    }

    // Atualizar o conteúdo no banco
    const updateData: any = {};
    if (finalConteudo) updateData.conteudo = finalConteudo;

    const { error } = await supabase
      .from(config.table)
      .update(updateData)
      .eq("id", recordId);

    if (error) {
      return NextResponse.json({ success: false, message: "Erro ao salvar conteúdo no banco." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Conteúdo salvo com sucesso!",
    });
  } catch (error) {
    console.error("[api/content] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno ao salvar conteúdo.",
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

    if (!agent || !validAgents.includes(agent)) {
      return NextResponse.json({ success: false, message: "Agente inválido." }, { status: 400 });
    }

    if (!recordId) {
      return NextResponse.json({ success: false, message: "ID do registro é obrigatório." }, { status: 400 });
    }

    const config = agentConfigs[agent];
    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq("id", recordId);

    if (error) {
      return NextResponse.json({ success: false, message: "Erro ao excluir conteúdo." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Conteúdo excluído com sucesso!" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno ao excluir.",
      },
      { status: 500 }
    );
  }
}
