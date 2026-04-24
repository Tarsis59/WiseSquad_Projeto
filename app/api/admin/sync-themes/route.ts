import { NextResponse } from "next/server";

import { syncThemesFromSheet } from "@/lib/theme-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncThemesFromSheet();
    return NextResponse.json({
      success: true,
      ...result,
      message: "Sincronização de temas concluída.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao sincronizar temas.",
      },
      { status: 500 }
    );
  }
}
