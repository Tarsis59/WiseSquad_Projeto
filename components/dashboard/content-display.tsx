"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Loader2, Sparkles, Pencil, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { marked } from "marked";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import type { GeneratedRecord, Tema } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { EditContentModal } from "./edit-content-modal";

marked.setOptions({ breaks: true, gfm: true });

interface ContentDisplayProps {
  selectedTheme: Tema | null;
  currentOutput: GeneratedRecord | null;
  loadingAgentLabel: string | null;
  onCopy: (text: string) => void;
  onUpdate: (id: string, agent: string, content: string) => Promise<void>;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onGenerateImage?: (agent: string, temaId: string) => Promise<void>;
  loadingImageAgent?: string | null;
}

export function ContentDisplay({
  selectedTheme,
  currentOutput,
  loadingAgentLabel,
  onCopy,
  onUpdate,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  totalItems,
  onGenerateImage,
  loadingImageAgent,
}: ContentDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function handleCopy(text: string) {
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-all duration-300">
        <CardHeader className="p-0">
          <div className="flex flex-col">
            {/* Top Section: Title & Description */}
            <div className="bg-slate-50/40 px-10 pt-10 pb-8 border-b border-slate-100/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Sparkles className="size-4" />
                </div>
                <Badge variant="secondary" className="rounded-full bg-blue-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border-blue-100">
                  Visualização de conteúdo
                </Badge>
              </div>
              
              <div className="max-w-3xl space-y-4">
                <CardTitle className="text-4xl font-black tracking-tighter text-slate-900 lg:text-5xl leading-[1.1]">
                  Resultado em <span className="text-blue-600 italic">Tempo Real</span>
                </CardTitle>
                <CardDescription className="text-base font-medium leading-relaxed text-slate-400 max-w-2xl">
                  O texto retornado pela API aparece aqui instantaneamente, pronto para ser revisado, editado ou copiado para suas redes.
                </CardDescription>
              </div>
            </div>

            {/* Bottom Section: Action Bar */}
            {currentOutput && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-6 bg-white">
                {/* Navigation Group */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5 shadow-inner">
                    <Button
                      disabled={!hasPrev}
                      onClick={onPrev}
                      size="icon"
                      variant="ghost"
                      className="size-10 rounded-xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 disabled:opacity-20 hover:shadow-sm"
                      title="Anterior"
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    
                    <div className="flex flex-col items-center px-4 border-x border-slate-100">
                      <span className="text-[9px] font-black tracking-[0.2em] text-slate-300 uppercase leading-none mb-1.5">Item</span>
                      <span className="text-sm font-black text-slate-900 tabular-nums leading-none">
                        {typeof currentIndex === 'number' ? `${currentIndex + 1}` : '--'} 
                        <span className="text-slate-300 mx-1 font-normal">/</span> 
                        {totalItems}
                      </span>
                    </div>

                    <Button
                      disabled={!hasNext}
                      onClick={onNext}
                      size="icon"
                      variant="ghost"
                      className="size-10 rounded-xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 disabled:opacity-20 hover:shadow-sm"
                      title="Próximo"
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </div>

                {/* Actions Group */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="outline"
                    className="h-12 flex-1 sm:flex-none gap-2.5 rounded-2xl border-slate-200 px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>

                  <Button
                    onClick={() => currentOutput && onGenerateImage?.(currentOutput.agent, currentOutput.tema_id)}
                    size="sm"
                    variant="outline"
                    disabled={loadingImageAgent === currentOutput.agent}
                    className="h-12 flex-1 sm:flex-none gap-2.5 rounded-2xl border-slate-200 px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 disabled:opacity-50 active:scale-95"
                  >
                    {loadingImageAgent === currentOutput?.agent ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                    Gerar Imagem
                  </Button>

                  <Button
                    onClick={() => handleCopy(currentOutput.conteudo)}
                    size="sm"
                    className={cn(
                      "h-12 flex-[2] sm:flex-none gap-2.5 rounded-2xl px-8 text-sm font-bold shadow-lg transition-all active:scale-95",
                      copied 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200" 
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copiar Conteúdo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {loadingAgentLabel ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-3xl border border-blue-100 bg-blue-50/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3 text-blue-700">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-lg font-bold tracking-tight uppercase">Gerando {loadingAgentLabel}...</p>
                </div>
                <div className="grid gap-4">
                  <div className="h-4 w-2/3 rounded-full bg-blue-100/50 animate-pulse" />
                  <div className="h-4 w-full rounded-full bg-blue-100/50 animate-pulse delay-75" />
                  <div className="h-4 w-5/6 rounded-full bg-blue-100/50 animate-pulse delay-150" />
                  <div className="h-32 rounded-3xl bg-white/60 border border-blue-100 animate-pulse delay-200" />
                </div>
              </motion.div>
            ) : currentOutput ? (
              <motion.div
                key={currentOutput.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.24 }}
                className="rounded-3xl border border-slate-100 bg-white shadow-inner p-8"
              >
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <Badge className="rounded-lg bg-blue-50 text-blue-700 border-blue-100 font-bold uppercase tracking-widest text-[9px]">{currentOutput.agent}</Badge>
                  <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold text-[10px]">TEMA: {selectedTheme?.titulo ?? currentOutput.titulo}</Badge>
                  <Badge variant="success" className="rounded-lg font-bold text-[10px]">{formatDateTime(currentOutput.created_at)}</Badge>
                </div>
                
                <h3 className="mb-6 text-2xl font-bold text-slate-900 tracking-tight leading-tight">{currentOutput.titulo}</h3>

                {/* Image with skeleton loading */}
                <div className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 group">
                  <ImageWithSkeleton
                    alt={`Capa gerada para ${currentOutput.titulo}`}
                    className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    height={1024}
                    src={currentOutput.media_url}
                    width={1536}
                  />
                </div>

                <div
                  className="prose-content max-h-[32rem] overflow-auto pr-4 text-slate-600 leading-relaxed font-medium text-[15px]"
                  dangerouslySetInnerHTML={{ __html: marked(currentOutput.conteudo) as string }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex min-h-[26rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center"
              >
                <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50">
                  <Sparkles className="size-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Pronto para Gerar</h3>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 leading-6">
                  Escolha um agente para criar o próximo conteúdo de alta conversão. O resultado aparecerá aqui instantaneamente.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <EditContentModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        output={currentOutput}
        onSave={onUpdate}
        onGenerateImage={onGenerateImage}
        isGeneratingImage={loadingImageAgent === currentOutput?.agent}
      />
    </>
  );
}

