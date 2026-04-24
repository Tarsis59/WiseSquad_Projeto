import { motion } from "framer-motion";
import { Briefcase, Check, Clapperboard, FileText, Film, Image, Loader2, Newspaper, Pencil, Play } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentType, GeneratedRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const agents = [
  {
    id: "blog" as const,
    title: "Blog",
    description: "Artigo completo otimizado para SEO e distribuição.",
    icon: FileText,
    iconWrap: "bg-blue-50 text-blue-600",
  },
  {
    id: "linkedin" as const,
    title: "LinkedIn",
    description: "Post profissional, consultivo e voltado à conversão.",
    icon: Briefcase,
    iconWrap: "bg-violet-50 text-violet-600",
  },
  {
    id: "youtube" as const,
    title: "YouTube",
    description: "Roteiro com gancho, estrutura e CTA final.",
    icon: Play,
    iconWrap: "bg-rose-50 text-rose-600",
  },
  {
    id: "reels" as const,
    title: "Reels",
    description: "Copy dinâmica com cortes visuais e ritmo curto.",
    icon: Film,
    iconWrap: "bg-amber-50 text-amber-600",
  },
  {
    id: "shorts" as const,
    title: "Shorts",
    description: "Script curto, rápido e pronto para retenção alta.",
    icon: Clapperboard,
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "substack" as const,
    title: "Substack",
    description: "Artigo analítico e estratégico para newsletter.",
    icon: Newspaper,
    iconWrap: "bg-slate-50 text-slate-600",
  },
];

interface AgentCardsProps {
  loadingAgent: AgentType | null;
  loadingImageAgent: AgentType | null;
  onRun: (agent: AgentType) => void;
  onGenerateImage: (agent: AgentType) => void;
  onConfirm?: (agent: AgentType, id: string, content: string) => void;
  allDisabled?: boolean;
  outputs: Record<AgentType, GeneratedRecord | null>;
  selectedThemeId?: string | null;
}

export function AgentCards({
  loadingAgent,
  loadingImageAgent,
  onRun,
  onGenerateImage,
  onConfirm,
  allDisabled = false,
  outputs,
  selectedThemeId,
}: AgentCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {agents.map((agent, index) => {
        const Icon = agent.icon;
        const isLoading = loadingAgent === agent.id;
        const isImageLoading = loadingImageAgent === agent.id;
        const output = outputs[agent.id];
        const hasText = !!output;
        const hasImage = !!output?.media_url;
        const isDisabled = allDisabled || isLoading || isImageLoading;

        return (
          <Card
            key={agent.id}
            onClick={() => {
              if (!hasText && !isDisabled) onRun(agent.id);
            }}
            className={cn(
              "group relative rounded-3xl border-slate-200 transition-all duration-300 cursor-default overflow-hidden",
              !hasText && !isDisabled && "cursor-pointer hover:border-blue-400 hover:shadow-2xl hover:-translate-y-1",
              isDisabled && !isLoading && !isImageLoading
                ? "opacity-50"
                : "hover:border-slate-300 hover:shadow-xl"
            )}
          >
            <CardContent className="flex flex-col p-6 h-full">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                className="flex-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", agent.iconWrap)}>
                    {isLoading || isImageLoading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <Icon className="size-6" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {hasText && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all active:scale-90"
                        title="Confirmar"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (output && onConfirm) {
                            onConfirm(agent.id, output.id, output.conteudo);
                          } else {
                             toast.success(`${agent.title} confirmado!`);
                          }
                        }}
                      >
                        <Check className={cn("size-4 font-black", output?.status === "confirmed" && "scale-125")} />
                      </Button>
                    )}
                    {hasText && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "size-7 rounded-full transition-all active:scale-90",
                          hasImage ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
                        )}
                        title={hasImage ? "Gerar Nova Imagem" : "Gerar Imagem"}
                        disabled={isImageLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateImage(agent.id);
                        }}
                      >
                        {isImageLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Image className="size-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">{agent.title}</h3>
                  <p className="text-sm leading-6 text-slate-500">{agent.description}</p>
                </div>
              </motion.div>

              {!hasText && !isLoading && (
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-blue-100" />
                  Clique para gerar texto
                  <div className="h-[1px] flex-1 bg-blue-100" />
                </div>
              )}

              {isLoading && (
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600 flex items-center gap-2 animate-pulse">
                   <div className="h-[1px] flex-1 bg-blue-100" />
                   Gerando conteúdo...
                   <div className="h-[1px] flex-1 bg-blue-100" />
                </div>
              )}

              {hasText && output?.status !== "confirmed" && (
                <div className="flex gap-2 mt-auto pt-4">
                  <Link
                    href={`/edit/${agent.id}/${output?.id}`}
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDisabled) e.preventDefault();
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 rounded-xl h-10 border-slate-200 text-slate-600"
                      disabled={isDisabled}
                    >
                      <Pencil className="size-3.5" />
                      <span className="text-xs font-semibold">Editar</span>
                    </Button>
                  </Link>

                  {!hasImage && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2 rounded-xl h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                      disabled={isDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateImage(agent.id);
                      }}
                    >
                      {isImageLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Image className="size-3.5" />
                      )}
                      <span className="text-xs font-semibold">Gerar Imagem</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
