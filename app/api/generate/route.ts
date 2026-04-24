import { NextResponse } from "next/server";

import { generateAllFormatsForTheme, generateContentForAgent } from "@/lib/generate";
import type { AgentType } from "@/lib/types";

export const dynamic = "force-dynamic";

const validAgents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "tiktok", "substack"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      agent?: AgentType;
      temaId?: string;
      force?: boolean;
      bulk?: boolean;
    };
    const agent = body.agent;
    const temaId = body.temaId;
    const force = body.force;
    const bulk = body.bulk;

    if (bulk) {
      if (!temaId) {
        return NextResponse.json({ success: false, message: "ID do tema é obrigatório para geração em massa." }, { status: 400 });
      }

      const results = await generateAllFormatsForTheme(temaId);
      return NextResponse.json({
        success: true,
        message: "Geração em massa concluída.",
        results,
      });
    }

    if (!agent || !validAgents.includes(agent)) {
      return NextResponse.json({ success: false, message: "Agente inválido." }, { status: 400 });
    }

    const result = await generateContentForAgent(agent, { temaId, force, useNanoBanana: true });

    return NextResponse.json({
      success: true,
      ...result,
      message: result?.empty ? "Nenhum tema pendente encontrado." : `${result?.label ?? agent} gerado com sucesso!`,
    });
  } catch (error) {
    console.error("[api/generate] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno ao gerar conteúdo.",
      },
      { status: 500 }
    );
  }
}
