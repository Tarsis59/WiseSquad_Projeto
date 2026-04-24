"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, WandSparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AgentCards } from "@/components/dashboard/agent-cards";
import { ContentDisplay } from "@/components/dashboard/content-display";
import { RecentOutput } from "@/components/dashboard/recent-output";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AgentType, GeneratedRecord, Tema } from "@/lib/types";

interface DashboardShellProps {
  initialThemes: Tema[];
  initialOutputs: GeneratedRecord[];
}

interface GenerateResponse {
  success: boolean;
  message?: string;
  agent?: string;
  empty?: boolean;
  reused?: boolean;
  record?: GeneratedRecord;
  tema?: Tema;
}

const agentsOrder: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "substack"];

function getAgentLabel(agent: AgentType) {
  switch (agent) {
    case "linkedin":
      return "LinkedIn";
    case "youtube":
      return "YouTube";
    case "substack":
      return "Substack";
    default:
      return agent.charAt(0).toUpperCase() + agent.slice(1);
  }
}

export function DashboardShell({ initialThemes, initialOutputs }: DashboardShellProps) {
  const router = useRouter();
  const [themes, setThemes] = useState(initialThemes);
  const [selectedTheme, setSelectedTheme] = useState<Tema | null>(initialThemes[0] ?? null);
  const [loadingAgent, setLoadingAgent] = useState<AgentType | null>(null);
  const [loadingImageAgent, setLoadingImageAgent] = useState<AgentType | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<GeneratedRecord | null>(initialOutputs[0] ?? null);
  const [recentOutputs, setRecentOutputs] = useState(initialOutputs);
  const [runningAll, setRunningAll] = useState(false);
  const [runAllStep, setRunAllStep] = useState(0);
  const [outputsByAgent, setOutputsByAgent] = useState<Record<AgentType, GeneratedRecord | null>>({} as Record<AgentType, GeneratedRecord | null>);

  const isAnyGenerating = loadingAgent !== null || loadingImageAgent !== null || runningAll;

  function applyGenerateResult(data: GenerateResponse) {
    if (data.empty) return;

    if (data.tema) {
      setThemes((prev) => {
        const updated = prev.map((t) => {
          if (t.id === data.tema?.id) {
            const isNew = data.record && !data.reused;
            const currentCount = t.completed_count ?? 0;
            const newCount = isNew ? Math.min(currentCount + 1, 6) : currentCount;
            
            return {
              ...t,
              ...data.tema,
              completed_count: newCount,
            };
          }
          return t;
        });

        return updated;
      });

      setSelectedTheme(data.tema);
    }

    if (data.record) {
      const record = data.record;
      setCurrentOutput(record);
      setRecentOutputs((c) => [record as GeneratedRecord, ...c].slice(0, 20));
      if (record.agent) {
        setOutputsByAgent((prev) => ({
          ...prev,
          [record.agent as AgentType]: record as GeneratedRecord,
        }));
      }
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    const toastId = toast.loading("Sincronizando e curando banco de dados...");
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Erro na sincronização");
      
      toast.success("Banco de dados sincronizado e curado!", { id: toastId });
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleRun(agent: AgentType) {
    if (isAnyGenerating) return;
    setLoadingAgent(agent);
    const toastId = toast.loading(`Gerando ${getAgentLabel(agent)} com a base WiseChats...`);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, temaId: selectedTheme?.id ?? null }),
      });

      const data = (await response.json()) as GenerateResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro ao gerar conteúdo.");
      }

      if (data.empty) {
        toast.info("Nenhum tema pendente encontrado.", { id: toastId });
        return;
      }

      applyGenerateResult(data);

      if (data.reused) {
        toast.success("Conteúdo existente reaproveitado para evitar duplicidade.", { id: toastId });
      } else {
        toast.success(data.message ?? `${getAgentLabel(agent)} gerado com sucesso!`, { id: toastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar conteúdo.", { id: toastId });
    } finally {
      setLoadingAgent(null);
    }
  }

  async function handleRunAll() {
    if (isAnyGenerating) return;
    if (!selectedTheme) {
      toast.info("Selecione ou importe um tema antes de gerar todos os formatos.");
      return;
    }

    setRunningAll(true);
    setRunAllStep(0);
    const totalAgents = agentsOrder.length;
    const toastId = toast.loading(`Iniciando geração completa para "${selectedTheme.titulo}"...`);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, temaId: selectedTheme.id }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        results?: Array<GenerateResponse & { success?: boolean; error?: unknown }>;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Erro na geração em massa.");
      }

      let completed = 0;
      const results = data.results ?? [];

      for (let i = 0; i < results.length; i++) {
        setRunAllStep(i + 1);
        const result = results[i];
        if (result && !result.empty && result.record) {
          applyGenerateResult(result as GenerateResponse);
          completed++;
        }
      }

      setRunningAll(false);
      setRunAllStep(0);

      if (completed === totalAgents) {
        toast.success(`Todos os ${completed} formatos gerados com sucesso!`, { id: toastId, duration: 6000 });
      } else if (completed > 0) {
        toast.success(`${completed}/${totalAgents} formatos gerados.`, { id: toastId, duration: 5000 });
      } else {
        toast.info("Nenhum conteúdo novo foi gerado.", { id: toastId });
      }
    } catch (error) {
      setRunningAll(false);
      setRunAllStep(0);
      toast.error(error instanceof Error ? error.message : "Erro na geração em massa.", { id: toastId });
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
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao salvar conteúdo.");
      setRecentOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, conteudo: content } : o)));
      if (currentOutput?.id === id) setCurrentOutput((prev) => (prev ? { ...prev, conteudo: content } : null));
      setOutputsByAgent((prev) => {
        const existing = prev[agent as AgentType];
        if (existing?.id === id) return { ...prev, [agent]: { ...existing, conteudo: content } };
        return prev;
      });
      toast.success("Conteúdo atualizado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar conteúdo.", { id: toastId });
      throw error;
    }
  }

  async function handleConfirmContent(agent: string, id: string, content: string) {
    const toastId = toast.loading("Confirmando...");
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: id, agent, conteudo: content, status: "confirmed" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao confirmar.");

      const updatedContent = content.includes("[CONFIRMED]") ? content : content + "\n\n[CONFIRMED]";
      
      setRecentOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, conteudo: updatedContent, status: "confirmed" } : o)));
      if (currentOutput?.id === id) setCurrentOutput((prev) => (prev ? { ...prev, conteudo: updatedContent, status: "confirmed" } : null));
      setOutputsByAgent((prev) => {
        const existing = prev[agent as AgentType];
        if (existing?.id === id) return { ...prev, [agent]: { ...existing, conteudo: updatedContent, status: "confirmed" } };
        return prev;
      });
      toast.success("Conteúdo confirmado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao confirmar.", { id: toastId });
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  async function handleGenerateImage(agent: AgentType) {
    if (isAnyGenerating || !selectedTheme) return;
    setLoadingImageAgent(agent);
    const toastId = toast.loading(`Gerando imagem para ${getAgentLabel(agent)}...`);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, temaId: selectedTheme.id }),
      });
      const data = (await response.json()) as { success: boolean; imageUrl?: string; message?: string };
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao gerar imagem.");
      
      const updateData = {
        media_url: data.imageUrl,
        imagem_url: agent === "youtube" ? undefined : data.imageUrl,
        thumbnail_url: agent === "youtube" ? data.imageUrl : undefined,
      };

      setOutputsByAgent((prev) => {
        const existing = prev[agent];
        if (existing) {
          return {
            ...prev,
            [agent]: {
              ...existing,
              ...updateData
            },
          };
        }
        return prev;
      });

      setRecentOutputs((prev) => prev.map(o => {
        if (o.agent === agent && o.tema_id === selectedTheme.id) {
          return { ...o, ...updateData };
        }
        return o;
      }));

      if (currentOutput?.agent === agent && currentOutput.tema_id === selectedTheme.id) {
        setCurrentOutput(prev => prev ? { ...prev, ...updateData } : null);
      }

      toast.success("Imagem gerada com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar imagem.", { id: toastId });
    } finally {
      setLoadingImageAgent(null);
    }
  }

  async function handleDeleteImage(recordId: string, agent: string) {
    if (!confirm("Deseja remover esta imagem?")) return;
    const toastId = toast.loading("Removendo imagem...");
    try {
      const response = await fetch(`/api/generate-image?recordId=${recordId}&agent=${agent}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao remover imagem.");

      const clearData = {
        media_url: null,
        imagem_url: null,
        thumbnail_url: null,
      };

      setRecentOutputs((prev) => prev.map((o) => (o.id === recordId ? { ...o, ...clearData } : o)));
      if (currentOutput?.id === recordId) setCurrentOutput((prev) => (prev ? { ...prev, ...clearData } : null));
      setOutputsByAgent((prev) => {
        const existing = prev[agent as AgentType];
        if (existing?.id === recordId) return { ...prev, [agent]: { ...existing, ...clearData } };
        return prev;
      });

      toast.success("Imagem removida com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover imagem.", { id: toastId });
    }
  }

  async function handleDeleteContent(id: string, agent: string) {
    if (!confirm("Tem certeza que deseja excluir todo este conteúdo (texto e imagem)?")) return;
    const toastId = toast.loading("Excluindo conteúdo...");
    try {
      const response = await fetch(`/api/content?recordId=${id}&agent=${agent}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao excluir conteúdo.");

      setRecentOutputs((prev) => prev.filter((o) => o.id !== id));
      if (currentOutput?.id === id) setCurrentOutput(null);
      setOutputsByAgent((prev) => {
        if (prev[agent as AgentType]?.id === id) {
          const next = { ...prev };
          delete next[agent as AgentType];
          return next;
        }
        return prev;
      });

      // Atualizar contagem no tema
      if (selectedTheme) {
        setThemes((prev) => prev.map((t) => {
          if (t.id === selectedTheme.id) {
            return { ...t, completed_count: Math.max(0, (t.completed_count ?? 0) - 1) };
          }
          return t;
        }));
      }

      toast.success("Conteúdo excluído com sucesso!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir.", { id: toastId });
    }
  }

  async function handleAddTheme(titulo: string) {
    try {
      const response = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Erro ao adicionar tema");

      const newTheme = data.tema as Tema;
      setThemes((prev) => [newTheme, ...prev]);
      setSelectedTheme(newTheme);
      toast.success(`Tema "${titulo}" adicionado com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar tema");
    }
  }

  const effectiveLoadingAgent = runningAll ? (agentsOrder[runAllStep - 1] ?? null) : loadingAgent;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar 
        selectedThemeId={selectedTheme?.id} 
        themes={themes} 
        onSelectTheme={setSelectedTheme} 
        onAddTheme={handleAddTheme}
      />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[900px] space-y-6 p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <Badge className="rounded-full px-3 py-1">Dashboard premium</Badge>
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Boa gestão, WiseChats.</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Gere conteúdos, visualize em tempo real e cure o banco de dados se necessário.</p>
                  </div>
                </div>
                <ThemeSelector selectedTheme={selectedTheme} />
              </div>
            </motion.div>
            <Card className="rounded-3xl border-slate-200 bg-white/90">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <WandSparkles className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Agentes de geração</p>
                      <p className="text-sm text-slate-500">Cure o banco se houver inconsistências.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={isAnyGenerating || isSyncing}
                      onClick={handleSync}
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-2 border-slate-200"
                    >
                      {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Sincronizar
                    </Button>
                    <Button
                      disabled={isAnyGenerating || !selectedTheme || isSyncing}
                      onClick={handleRunAll}
                      size="sm"
                      variant="default"
                      className="shrink-0 gap-2"
                    >
                      {runningAll ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {runAllStep}/{agentsOrder.length} formatos...
                        </>
                      ) : (
                        <>
                          <Zap className="size-4" />
                          Gerar Todos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Separator />
                <AgentCards
                  loadingAgent={effectiveLoadingAgent}
                  loadingImageAgent={loadingImageAgent}
                  onRun={handleRun}
                  onGenerateImage={handleGenerateImage}
                  onConfirm={handleConfirmContent}
                  allDisabled={runningAll}
                  outputs={outputsByAgent}
                  selectedThemeId={selectedTheme?.id}
                />
              </CardContent>
            </Card>
            <ContentDisplay
              currentOutput={currentOutput}
              loadingAgentLabel={effectiveLoadingAgent ? getAgentLabel(effectiveLoadingAgent) : null}
              onCopy={handleCopy}
              onUpdate={handleUpdateContent}
              selectedTheme={selectedTheme}
              currentIndex={currentOutput ? recentOutputs.findIndex((o) => o.id === currentOutput.id) : -1}
              totalItems={recentOutputs.length}
              hasNext={currentOutput ? recentOutputs.findIndex((o) => o.id === currentOutput.id) > 0 : false}
              hasPrev={currentOutput ? recentOutputs.findIndex((o) => o.id === currentOutput.id) < recentOutputs.length - 1 : false}
              onNext={() => {
                const idx = recentOutputs.findIndex((o) => o.id === currentOutput?.id);
                if (idx > 0) setCurrentOutput(recentOutputs[idx - 1]);
              }}
              onPrev={() => {
                const idx = recentOutputs.findIndex((o) => o.id === currentOutput?.id);
                if (idx < recentOutputs.length - 1) setCurrentOutput(recentOutputs[idx + 1]);
              }}
              onGenerateImage={handleGenerateImage}
              onDeleteImage={handleDeleteImage}
              onDeleteContent={handleDeleteContent}
              loadingImageAgent={loadingImageAgent}
            />
          </div>
        </div>
        <div className="hidden w-[440px] shrink-0 overflow-hidden border-l border-slate-200 bg-white 2xl:flex 2xl:flex-col">
          <RecentOutput 
            onCopy={handleCopy} 
            onUpdate={handleUpdateContent} 
            outputs={recentOutputs} 
            onGenerateImage={handleGenerateImage}
            onDeleteImage={handleDeleteImage}
            onDeleteContent={handleDeleteContent}
            loadingImageAgent={loadingImageAgent}
          />
        </div>
      </main>
    </div>
  );
}
