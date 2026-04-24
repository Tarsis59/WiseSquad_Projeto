"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, Pencil, Eye, Check } from "lucide-react";
import { marked } from "marked";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditContentClientProps {
  agent: string;
  recordId: string;
  initialContent: string;
  temaId: string;
  titulo: string;
  label: string;
}

export function EditContentClient({
  agent,
  recordId,
  initialContent,
  temaId,
  titulo,
  label,
}: EditContentClientProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSave() {
    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, recordId, conteudo: content }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Erro ao salvar.");
      }

      toast.success("Alterações salvas!", { id: toastId });
      
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirm() {
    setIsSaving(true);
    const toastId = toast.loading("Confirmando conteúdo...");

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, recordId, conteudo: content, status: "confirmed" }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Erro ao confirmar.");
      }

      toast.success("Conteúdo confirmado!", { id: toastId });
      
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao confirmar.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-2 text-slate-500 hover:bg-slate-100"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-lg bg-blue-50 text-blue-700 border-blue-100 font-bold uppercase tracking-widest text-[9px]">
                {label}
              </Badge>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modo Edição</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-slate-500 hover:bg-slate-100"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              onClick={handleConfirm}
              disabled={isSaving}
            >
              <Check className="size-4" />
              Confirmar
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200"
              onClick={handleSave}
              disabled={isSaving || content === initialContent}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-10"
        >
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 lg:text-5xl leading-tight">
            {titulo}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-slate-500">
            Ajuste o texto abaixo. O preview à direita é atualizado em tempo real para sua conferência.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Editor Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex size-6 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Pencil className="size-3" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Editor Markdown</h2>
            </div>
            
            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-xl shadow-slate-200/40">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] p-8 text-base leading-relaxed text-slate-700 bg-transparent resize-none outline-none font-medium placeholder:text-slate-300"
                placeholder="Comece a escrever seu conteúdo aqui..."
              />
              <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {content.length} caracteres
                </span>
                {content !== initialContent && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    <div className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Alterações não salvas
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex size-6 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Eye className="size-3" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Preview em Tempo Real</h2>
            </div>

            <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-xl shadow-slate-200/40">
              <div 
                className="prose-content w-full h-[648px] p-8 overflow-y-auto text-base leading-relaxed text-slate-600 font-medium"
                dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
