import { NextResponse } from "next/server";

import { fetchPendingThemes, fetchRecentOutputs } from "@/lib/generate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [outputs, themes] = await Promise.all([fetchRecentOutputs(), fetchPendingThemes()]);

    return NextResponse.json({
      success: true,
      outputs,
      themes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao carregar histórico.",
      },
      { status: 500 }
    );
  }
}
