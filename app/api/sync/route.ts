import { NextResponse } from "next/server";
import { syncAllThemesStatus } from "@/lib/generate";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await syncAllThemesStatus();
    return NextResponse.json({ success: true, message: "Sincronização concluída com sucesso!" });
  } catch (error) {
    console.error("[api/sync] Erro:", error);
    return NextResponse.json({ success: false, message: "Erro na sincronização." }, { status: 500 });
  }
}
