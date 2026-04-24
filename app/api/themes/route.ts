import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { titulo } = await req.json();

    if (!titulo || typeof titulo !== "string") {
      return NextResponse.json(
        { success: false, message: "Título é obrigatório." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("temas")
      .insert([
        {
          titulo,
          status: "pendente",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[api/themes] Erro ao criar tema:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao criar tema no banco de dados." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tema: {
        ...data,
        completed_count: 0,
        total_count: 6
      }
    });
  } catch (error) {
    console.error("[api/themes] Erro inesperado:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
