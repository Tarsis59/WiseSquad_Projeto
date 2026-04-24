import { ExternalLink, FileText, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tema } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  themes: Tema[];
  selectedThemeId?: string | null;
  onSelectTheme: (theme: Tema) => void;
  onAddTheme: (titulo: string) => Promise<void>;
}

export function Sidebar({ themes, selectedThemeId, onSelectTheme, onAddTheme }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pendente" | "concluido">("pendente");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredThemes = themes.filter((theme) => {
    const matchesSearch = theme.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    const isComplete = (theme.completed_count ?? 0) >= (theme.total_count ?? 6);
    const matchesTab = activeTab === "concluido" ? isComplete : !isComplete;
    return matchesSearch && matchesTab;
  });

  return (
    <aside className="hidden h-full w-80 shrink-0 overflow-hidden border-r border-slate-200 bg-white xl:flex xl:flex-col">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-950">WiseSquad</p>
            <p className="text-sm text-slate-500">Content Lab</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab("pendente")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
              activeTab === "pendente" 
                ? "bg-white text-orange-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Pendentes
          </button>
          <button
            onClick={() => setActiveTab("concluido")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
              activeTab === "concluido" 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Completos
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar em ${activeTab === 'pendente' ? 'pendentes' : 'completos'}...`}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-9 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <Button
            size="icon"
            onClick={() => setIsAdding(!isAdding)}
            className={cn(
              "size-10 rounded-xl shrink-0 transition-all shadow-sm",
              isAdding ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isAdding ? <X className="size-5" /> : <Plus className="size-5" />}
          </Button>
        </div>

        {isAdding && (
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Novo Tema</p>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Título do tema..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    setLoading(true);
                    await onAddTheme(newTitle.trim());
                    setNewTitle("");
                    setIsAdding(false);
                    setLoading(false);
                  }
                }}
                className="w-full h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div className="flex gap-2">
                <Button
                  disabled={loading || !newTitle.trim()}
                  onClick={async () => {
                    setLoading(true);
                    await onAddTheme(newTitle.trim());
                    setNewTitle("");
                    setIsAdding(false);
                    setLoading(false);
                  }}
                  className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Adicionar Tema"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-2">
          {filteredThemes.length ? (
            filteredThemes.map((theme) => {
              const selected = theme.id === selectedThemeId;

              return (
                <button
                  key={theme.id}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
                    selected
                      ? "border-orange-200 bg-orange-50 shadow-sm"
                      : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                  )}
                  onClick={() => onSelectTheme(theme)}
                  type="button"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                      selected ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-bold", selected ? "text-orange-900" : "text-slate-900")}>
                      {theme.titulo}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest",
                            theme.status === "concluido"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          )}
                        >
                          {theme.status === "concluido" ? "Concluído" : "Pendente"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {theme.completed_count ?? 0}/{theme.total_count ?? 6}
                        </span>
                      </div>
                      <Link
                        href={`/tema/${theme.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Detalhes <ExternalLink className="size-3" />
                      </Link>
                    </div>
                    {/* Progress Bar Mini */}
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-orange-400 transition-all duration-500" 
                         style={{ width: `${((theme.completed_count ?? 0) / (theme.total_count ?? 6)) * 100}%` }}
                       />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <FileText className="size-5 text-slate-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-slate-700">
                {searchQuery ? "Nenhum tema encontrado" : "Nenhum tema pendente"}
              </p>
              <p className="mb-4 text-xs leading-5 text-slate-500">
                {searchQuery ? "Tente outro termo de busca." : "Importe os 36 títulos da planilha para começar a gerar conteúdos."}
              </p>
              {!searchQuery && (
                <Link
                  href="/configuracoes"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="size-3.5" />
                  Importar 36 temas
                </Link>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 p-4">
        <Link
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/configuracoes"
        >
          Configurações de Agentes
        </Link>
      </div>
    </aside>
  );
}
