import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("agentes_customizados")
    .select("id, nome, prompt_sistema")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    agents: data ?? [],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nome?: string; prompt_sistema?: string };
    const nome = body.nome?.trim();
    const promptSistema = body.prompt_sistema?.trim();

    if (!nome || !promptSistema) {
      return NextResponse.json(
        { success: false, message: "Nome do agente e prompt são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("agentes_customizados")
      .insert({
        nome,
        prompt_sistema: promptSistema,
      })
      .select("id, nome, prompt_sistema")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agent: data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao criar agente." },
      { status: 500 }
    );
  }
}
