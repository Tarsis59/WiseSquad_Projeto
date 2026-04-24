import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { agentConfigs } from "@/lib/generate";
import type { AgentType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const { data: tema, error: temaError } = await supabase
      .from("temas")
      .select("id, titulo, status, created_at")
      .eq("id", id)
      .maybeSingle();

    if (temaError) {
      return NextResponse.json({ success: false, message: temaError.message }, { status: 500 });
    }

    if (!tema) {
      return NextResponse.json({ success: false, message: "Tema não encontrado." }, { status: 404 });
    }

    const outputs: Record<string, unknown[]> = {};
    const agents = Object.keys(agentConfigs) as AgentType[];

    await Promise.all(
      agents.map(async (agent) => {
        const config = agentConfigs[agent];
        const { data, error } = await supabase
          .from(config.table)
          .select("id, tema_id, titulo, conteudo, imagem_url, thumbnail_url, created_at")
          .eq("tema_id", id)
          .order("id", { ascending: false })
          .limit(1);

        if (!error && data) {
          outputs[agent] = data;
        }
      })
    );

    // Custom agents outputs
    const { data: customOutputs, error: customError } = await supabase
      .from("custom_outputs")
      .select("id, tema_id, agent_id, titulo, conteudo, created_at")
      .eq("tema_id", id)
      .order("id", { ascending: false });

    if (!customError && customOutputs) {
      outputs["custom"] = customOutputs;
    }

    return NextResponse.json({
      success: true,
      tema,
      outputs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno.",
      },
      { status: 500 }
    );
  }
}
