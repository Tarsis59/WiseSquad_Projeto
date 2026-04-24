"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, Copy, Image as ImageIcon, Loader2, Pencil, Trash2, Wand2, WandSparkles } from "lucide-react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditContentModal } from "@/components/dashboard/edit-content-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AgentType, GeneratedRecord, Tema } from "@/lib/types";
import { cn } from "@/lib/utils";

marked.setOptions({ breaks: true, gfm: true });

interface ThemeDetailContentProps {
  initialTema: Tema;
  initialOutputs: Record<string, GeneratedRecord[]>;
}

const agentLabels: Record<string, string> = {
  blog: "Blog",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  reels: "Reels",
  shorts: "Shorts",
  substack: "Substack",
};

const agentBadgeColors: Record<string, string> = {
  blog: "bg-blue-50 text-blue-700 border-blue-200",
  linkedin: "bg-violet-50 text-violet-700 border-violet-200",
  youtube: "bg-rose-50 text-rose-700 border-rose-200",
  reels: "bg-amber-50 text-amber-700 border-amber-200",
  shorts: "bg-emerald-50 text-emerald-700 border-emerald-200",
  substack: "bg-slate-50 text-slate-700 border-slate-200",
};

const agents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "substack"];

export function ThemeDetailContent({ initialTema, initialOutputs }: ThemeDetailContentProps) {
  const router = useRouter();
  const [tema, setTema] = useState(initialTema);
  const [outputs, setOutputs] = useState(initialOutputs);
  const [loadingAgent, setLoadingAgent] = useState<AgentType | null>(null);
  const [loadingImageAgent, setLoadingImageAgent] = useState<AgentType | null>(null);
  const [editingOutput, setEditingOutput] = useState<GeneratedRecord | null>(null);

  const completedCount = useMemo(() => 
    agents.filter((agent) => (outputs[agent] ?? []).length > 0).length,
  [outputs]);

  const missingAgents = useMemo(() => 
    agents.filter((agent) => (outputs[agent] ?? []).length === 0),
  [outputs]);

  async function handleGenerate(agent: AgentType) {
    setLoadingAgent(agent);
    const toastId = toast.loading(`Gerando conteúdo para ${agentLabels[agent]}...`);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, temaId: tema.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro ao gerar conteúdo.");
      }

      if (data.record) {
        setOutputs((prev) => ({
          ...prev,
          [agent]: [data.record as GeneratedRecord],
        }));
      }

      toast.success(`${agentLabels[agent]} gerado com sucesso!`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar conteúdo.", { id: toastId });
    } finally {
      setLoadingAgent(null);
    }
  }

  async function handleGenerateImage(agent: AgentType) {
    setLoadingImageAgent(agent);
    const toastId = toast.loading(`Gerando imagem para ${agentLabels[agent]}...`);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, temaId: tema.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro ao gerar imagem.");
      }

      setOutputs((prev) => {
        const existing = prev[agent]?.[0];
        if (existing) {
          const updated = {
            ...existing,
            media_url: data.imageUrl ?? existing.media_url,
            imagem_url: agent === "youtube" ? existing.imagem_url : data.imageUrl,
            thumbnail_url: agent === "youtube" ? data.imageUrl : existing.thumbnail_url,
          };
          return { ...prev, [agent]: [updated] };
        }
        return prev;
      });

      toast.success("Imagem gerada com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar imagem.", { id: toastId });
    } finally {
      setLoadingImageAgent(null);
    }
  }

  async function handleDeleteContent(id: string, agent: string) {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    const toastId = toast.loading("Excluindo conteúdo...");

    try {
      const response = await fetch(`/api/content?recordId=${id}&agent=${agent}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro ao excluir conteúdo.");
      }

      setOutputs((prev) => ({
        ...prev,
        [agent]: (prev[agent] ?? []).filter((o) => o.id !== id),
      }));

      toast.success("Conteúdo excluído com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir.", { id: toastId });
    }
  }

  async function handleUpdateContent(id: string, agent: string, content: string) {
    const toastId = toast.loading("Salvando alterações...");

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: id, agent, conteudo: content }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro ao salvar conteúdo.");
      }

      setOutputs((prev) => {
        const list = prev[agent] ?? [];
        return {
          ...prev,
          [agent]: list.map((o) => (o.id === id ? { ...o, conteudo: content } : o)),
        };
      });

      toast.success("Conteúdo atualizado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar conteúdo.", { id: toastId });
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Navigation */}
        <div className="mb-10">
          <Button
            onClick={() => router.push("/")}
            className="group h-12 gap-3 rounded-2xl border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            variant="outline"
          >
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            VOLTAR AO DASHBOARD
          </Button>
        </div>

        {/* Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-12 overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60"
        >
          <div className="flex flex-col lg:flex-row lg:items-center">
            {/* Title & Info */}
            <div className="flex-1 p-10 lg:p-12 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge 
                  className={cn(
                    "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                    completedCount === agents.length 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-orange-50 text-orange-600 border-orange-100"
                  )}
                  variant="outline"
                >
                  {completedCount === agents.length ? "Concluído" : "Pendente"}
                </Badge>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  ID: {String(tema.id).slice(0, 8)}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                  {tema.titulo}
                </h1>
                <p className="text-base font-medium text-slate-400 max-w-xl leading-relaxed">
                  Visualize, gerencie e gere todos os formatos de conteúdo para este tema em uma única central inteligente.
                </p>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="lg:w-[320px] bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 p-10 lg:p-12 flex flex-col justify-center items-center text-center space-y-4">
              <div className="relative size-32 flex items-center justify-center">
                <svg className="size-full -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * completedCount) / agents.length}
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      completedCount === agents.length ? "text-emerald-500" : "text-blue-600"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {Math.round((completedCount / agents.length) * 100)}%
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {completedCount} de {agents.length} formatos
                </p>
                <p className="text-xs font-bold text-slate-400">
                  {missingAgents.length > 0 
                    ? `Faltam ${missingAgents.length} itens` 
                    : "Tudo pronto!"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {agents.map((agent, index) => {
            const agentOutputs = outputs[agent] ?? [];
            const output = agentOutputs[0];
            const label = agentLabels[agent] ?? agent;
            const badgeColor = agentBadgeColors[agent] ?? "bg-slate-50 text-slate-700 border-slate-200";
            const isGenerating = loadingAgent === agent;
            const isGeneratingImage = loadingImageAgent === agent;
            const hasImage = !!(output?.media_url || output?.imagem_url || output?.thumbnail_url);

            return (
              <motion.div
                key={agent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => {
                    if (!output && !isGenerating) handleGenerate(agent);
                  }}
                  className={cn(
                    "rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-all duration-300",
                    !output && !isGenerating && "cursor-pointer hover:border-blue-400 hover:shadow-xl hover:-translate-y-1",
                    output && "bg-white"
                  )}
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${badgeColor}`}>
                          {label}
                        </span>
                        {output ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="size-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Gerado</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendente</span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold text-slate-900">
                        {output ? output.titulo : `Aguardando geração de ${label}`}
                      </CardTitle>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {output ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2 rounded-xl h-9 text-slate-600 border-slate-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOutput(output);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          {!hasImage && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="gap-2 rounded-xl h-9 bg-slate-900 hover:bg-slate-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateImage(agent);
                              }}
                              disabled={isGeneratingImage}
                            >
                              {isGeneratingImage ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                              Gerar Imagem
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="size-9 rounded-xl p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContent(output.id, agent);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="size-9 rounded-xl p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(output.conteudo);
                              toast.success("Copiado!");
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-2 rounded-xl h-9 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(agent);
                          }}
                          disabled={isGenerating}
                        >
                          {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}
                          Gerar Agora
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-0">
                    {output ? (
                      <div className="p-6 space-y-4 bg-white/50">
                        {hasImage && (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 group relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`Capa ${label}`}
                              className="max-h-[300px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              src={output.media_url || output.imagem_url || output.thumbnail_url || ""}
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="gap-2 rounded-full backdrop-blur-md bg-white/80"
                                onClick={() => handleGenerateImage(agent)}
                                disabled={isGeneratingImage}
                              >
                                {isGeneratingImage ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                                Substituir Imagem
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm leading-7 text-slate-700 shadow-inner">
                          {output.conteudo}
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center bg-slate-50/50">
                        {isGenerating ? (
                           <div className="flex flex-col items-center py-4">
                              <Loader2 className="size-8 animate-spin text-blue-500 mb-3" />
                              <p className="text-sm font-bold text-blue-600 animate-pulse">GERANDO CONTEÚDO...</p>
                           </div>
                        ) : (
                          <>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400 mb-4 transition-transform group-hover:scale-110">
                              <WandSparkles className="size-6" />
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-1">Conteúdo pendente</h4>
                            <p className="text-xs text-slate-500 mb-4">Clique no card para gerar o {label}.</p>
                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="h-px w-8 bg-blue-100" />
                               GERAR COM INTELIGÊNCIA ARTIFICIAL
                               <div className="h-px w-8 bg-blue-100" />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <EditContentModal
        isOpen={!!editingOutput}
        onClose={() => setEditingOutput(null)}
        output={editingOutput}
        onSave={handleUpdateContent}
      />
    </div>
  );
}
