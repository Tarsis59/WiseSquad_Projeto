"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock3, Copy, Pencil, ExternalLink, Search, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import type { AgentType, GeneratedRecord } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { EditContentModal } from "./edit-content-modal";

interface RecentOutputProps {
  outputs: GeneratedRecord[];
  onCopy: (text: string) => void;
  onUpdate: (id: string, agent: string, content: string) => Promise<void>;
  onGenerateImage?: (agent: string, temaId: string) => Promise<void>;
  loadingImageAgent?: string | null;
}

const tabs = [
  { id: "all", label: "Todos" },
  { id: "blog", label: "Blog" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
  { id: "substack", label: "Substack" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const agentColors: Record<AgentType, string> = {
  blog: "bg-blue-50 text-blue-700 border-blue-200",
  linkedin: "bg-violet-50 text-violet-700 border-violet-200",
  youtube: "bg-rose-50 text-rose-700 border-rose-200",
  reels: "bg-amber-50 text-amber-700 border-amber-200",
  shorts: "bg-emerald-50 text-emerald-700 border-emerald-200",
  substack: "bg-slate-50 text-slate-700 border-slate-200",
};

export function RecentOutput({ outputs, onCopy, onUpdate, onGenerateImage, loadingImageAgent }: RecentOutputProps) {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingOutput, setEditingOutput] = useState<GeneratedRecord | null>(null);

  const filteredOutputs = useMemo(() => {
    return outputs.filter((o) => {
      const matchesTab = activeTab === "all" || o.agent === activeTab;
      const matchesSearch = o.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.conteudo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [outputs, activeTab, searchQuery]);

  return (
    <div className="flex h-full flex-col relative bg-white border-l border-slate-100">
      {/* ── Sticky header ── */}
      <div className="shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2.5 text-xl font-black text-slate-900 tracking-tight">
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock3 className="size-5" />
              </div>
              Histórico Recente
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-10">
              Análise e gestão de conteúdos
            </p>
          </div>
          <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 px-3 py-1 font-black text-[10px] text-slate-400 uppercase tracking-wider">
            {outputs.length} itens
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar por título ou conteúdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-[18px] bg-slate-50 border border-slate-100 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Tabs - Modernized */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          {tabs.map((tab) => {
            const count =
              tab.id === "all"
                ? outputs.length
                : outputs.filter((o) => o.agent === tab.id).length;
            const isActive = activeTab === tab.id;

            if (count === 0 && tab.id !== "all") return null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2.5 rounded-2xl px-5 py-2.5 text-xs font-black transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[9px] font-black tabular-nums transition-colors",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/50 text-slate-500"
                )}>
                  {count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/30">
        {filteredOutputs.length ? (
          filteredOutputs.map((output, index) => (
            <div
              key={`${output.agent}-${output.id}-${index}`}
              className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer"
              onClick={() => setEditingOutput(output)}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-2.5 py-1 text-[9px] uppercase tracking-widest font-black",
                      agentColors[output.agent]
                    )}
                  >
                    {output.agent}
                  </span>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400">{formatDateTime(output.created_at)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl opacity-0 group-hover:opacity-100 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingOutput(output);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {output.titulo}
              </h3>
              <p className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">REF: {output.tema_id}</p>
              
              {output.media_url !== undefined ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <ImageWithSkeleton
                    alt={`Capa de ${output.titulo}`}
                    className="h-28 w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                    height={320}
                    src={output.media_url}
                    width={640}
                  />
                </div>
              ) : null}
              
              <p className="mt-3 max-h-20 overflow-hidden text-ellipsis whitespace-pre-wrap text-xs leading-relaxed text-slate-500 font-medium">
                {output.conteudo}
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 text-slate-600 border-none shadow-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(output.conteudo);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="size-3.5 mr-2" />
                  Copiar
                </Button>
                <Button
                  className="h-9 w-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none transition-transform active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingOutput(output);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-300">
               <Search className="size-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Nenhum resultado</h4>
            <p className="text-xs text-slate-500 max-w-[200px]">
              Tente ajustar sua pesquisa ou trocar o filtro de formato.
            </p>
          </div>
        )}
      </div>

      <EditContentModal
        isOpen={!!editingOutput}
        onClose={() => setEditingOutput(null)}
        output={editingOutput}
        onSave={onUpdate}
        onGenerateImage={onGenerateImage}
        isGeneratingImage={loadingImageAgent === editingOutput?.agent}
      />
    </div>
  );
}


