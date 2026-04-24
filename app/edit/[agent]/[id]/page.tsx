import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { agentConfigs } from "@/lib/generate";
import type { AgentType } from "@/lib/types";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

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
  if (!config) {
    return null;
  }

  const { data, error } = await supabase
    .from(config.table)
    .select("id, tema_id, titulo, conteudo, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Record<string, unknown>;
}

export default async function EditContentPage({ params }: { params: Promise<{ agent: string; id: string }> }) {
  const { agent, id } = await params;
  const data = await fetchContent(agent as AgentType, id);

  if (!data) {
    notFound();
  }

  const label = agentLabels[agent] ?? agent;
  const conteudo = typeof data.conteudo === "string" ? data.conteudo : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={`/tema/${data.tema_id}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-4 inline mr-1" />
            Voltar
          </Link>
        </div>

        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{label}</Badge>
            <span className="text-sm text-slate-500">Editando conteúdo</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {typeof data.titulo === "string" ? data.titulo : "Editar Conteúdo"}
          </h1>
          <p className="text-sm text-slate-500">
            Edite o conteúdo abaixo. As alterações serão salvas no banco de dados.
          </p>
        </div>

        <EditForm
          agent={agent as AgentType}
          recordId={id}
          initialContent={conteudo}
          temaId={typeof data.tema_id === "string" ? data.tema_id : ""}
        />
      </div>
    </div>
  );
}

function EditForm({
  agent,
  recordId,
  initialContent,
  temaId,
}: {
  agent: AgentType;
  recordId: string;
  initialContent: string;
  temaId: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Editor</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <EditFormClient
            agent={agent}
            recordId={recordId}
            initialContent={initialContent}
            temaId={temaId}
          />
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Preview</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div
            className="prose-content max-h-[500px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: marked(initialContent) as string }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EditFormClient({
  agent,
  recordId,
  initialContent,
  temaId,
}: {
  agent: AgentType;
  recordId: string;
  initialContent: string;
  temaId: string;
}) {
  return (
    <form
      id="edit-form"
      action={async (formData: FormData) => {
        "use server";
        const conteudo = formData.get("conteudo") as string;

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent, recordId, conteudo }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message ?? "Erro ao salvar.");
        }
      }}
    >
      <textarea
        name="conteudo"
        defaultValue={initialContent}
        className="w-full h-[500px] rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
        placeholder="Digite o conteúdo aqui..."
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit" form="edit-form" className="gap-1.5">
          <Save className="size-4" />
          Salvar Alterações
        </Button>
        <Link href={`/tema/${temaId}`}>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
