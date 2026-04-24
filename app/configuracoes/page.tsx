"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus, RefreshCw, Trash2, Cog, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomAgent } from "@/lib/types";

interface AgentsResponse {
  success: boolean;
  message?: string;
  agents?: CustomAgent[];
}

interface AgentResponse {
  success: boolean;
  message?: string;
  agent?: CustomAgent;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [promptSistema, setPromptSistema] = useState("");
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingThemes, setSyncingThemes] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadAgents() {
    try {
      const response = await fetch("/api/custom-agents");
      const data = (await response.json()) as AgentsResponse;
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao buscar agentes.");
      setAgents(data.agents ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar agentes.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/custom-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, prompt_sistema: promptSistema }),
      });
      const data = (await response.json()) as AgentResponse;
      if (!response.ok || !data.success || !data.agent) throw new Error(data.message ?? "Erro ao salvar agente.");
      setAgents((current) => [data.agent as CustomAgent, ...current]);
      setNome("");
      setPromptSistema("");
      toast.success("Novo agente salvo com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar agente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(agentId: string) {
    if (!confirm("Deseja realmente excluir este agente?")) return;
    setDeletingId(agentId);
    try {
      const response = await fetch(`/api/custom-agents/${agentId}`, { method: "DELETE" });
      const data = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !data.success) throw new Error(data.message ?? "Erro ao excluir agente.");
      setAgents((current) => current.filter((agent) => agent.id !== agentId));
      toast.success("Agente removido com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover agente.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSyncThemes() {
    setSyncingThemes(true);
    const toastId = toast.loading("Sincronizando temas com a planilha...");
    try {
      const response = await fetch("/api/admin/sync-themes", { method: "POST" });
      const data = (await response.json()) as { success: boolean; message?: string; inserted?: number; skipped?: number };
      if (!response.ok || !data.success) throw new Error(data.message ?? "Falha ao sincronizar temas.");
      toast.success(`Sincronização concluída. Inseridos: ${data.inserted ?? 0}, já existentes: ${data.skipped ?? 0}.`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar temas.", { id: toastId });
    } finally {
      setSyncingThemes(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Cog className="size-5" />
              </div>
              <Badge variant="secondary" className="rounded-full bg-blue-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border-blue-100">
                Operação & IA
              </Badge>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                Configurações <span className="text-blue-600">Avançadas</span>
              </h1>
              <p className="mt-2 text-base font-medium text-slate-400 max-w-xl leading-relaxed">
                Personalize o comportamento da sua equipe de IA e gerencie títulos de conteúdo em massa.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3">
            <Button 
              disabled={syncingThemes} 
              onClick={handleSyncThemes} 
              variant="outline"
              className="h-12 gap-2.5 rounded-2xl border-slate-200 px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 active:scale-95"
            >
              {syncingThemes ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Importar 36 Títulos
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="h-12 gap-2.5 rounded-2xl border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
              variant="outline"
            >
              <ChevronLeft className="size-5" />
              VOLTAR AO DASHBOARD
            </Button>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5"
          >
            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-xl shadow-slate-200/40">
              <CardHeader className="bg-slate-50/30 p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <UserPlus className="size-4" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight text-slate-900">Novo Agente</CardTitle>
                </div>
                <CardDescription className="text-sm font-medium text-slate-400">
                  Defina a personalidade e as regras de um novo colaborador de IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400" htmlFor="nome">
                      Nome da Identidade
                    </label>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-100 bg-slate-50/50 px-5 text-sm font-bold text-slate-900 outline-none ring-blue-500/10 transition focus:bg-white focus:ring-4 focus:border-blue-500"
                      id="nome"
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Ex: Consultor Sênior de Marketing"
                      required
                      value={nome}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400" htmlFor="prompt_sistema">
                      Prompt de Comportamento
                    </label>
                    <textarea
                      className="min-h-48 w-full resize-none rounded-[18px] border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700 outline-none ring-blue-500/10 transition focus:bg-white focus:ring-4 focus:border-blue-500"
                      id="prompt_sistema"
                      onChange={(event) => setPromptSistema(event.target.value)}
                      placeholder="Descreva as instruções detalhadas..."
                      required
                      value={promptSistema}
                    />
                  </div>

                  <Button 
                    disabled={saving} 
                    type="submit"
                    className="w-full h-12 gap-3 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    SALVAR IDENTIDADE
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* List Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7"
          >
            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-xl shadow-slate-200/40 min-h-[500px]">
              <CardHeader className="bg-slate-50/30 p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Users className="size-4" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight text-slate-900">Agentes Ativos</CardTitle>
                </div>
                <CardDescription className="text-sm font-medium text-slate-400">
                  Agentes customizados prontos para uso em suas gerações.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {loadingList ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <Loader2 className="size-8 animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Carregando base...</p>
                  </div>
                ) : agents.length ? (
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div 
                        key={agent.id} 
                        className="group rounded-[24px] border border-slate-100 bg-slate-50/30 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-black text-slate-900">{agent.nome}</p>
                              <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[9px] uppercase tracking-widest">Ativo</Badge>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-500 font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                              {agent.prompt_sistema}
                            </p>
                          </div>

                          <Button
                            disabled={deletingId === agent.id}
                            onClick={() => handleDelete(agent.id)}
                            size="icon"
                            variant="ghost"
                            className="size-10 rounded-xl shrink-0 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                          >
                            {deletingId === agent.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center rounded-[24px] border-2 border-dashed border-slate-100">
                    <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                       <Users className="size-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Nenhum agente cadastrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
