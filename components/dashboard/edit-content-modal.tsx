"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Maximize2, Minimize2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedRecord } from "@/lib/types";

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  output: GeneratedRecord | null;
  onSave: (id: string, agent: string, content: string) => Promise<void>;
  onGenerateImage?: (agent: string, temaId: string) => Promise<void>;
  isGeneratingImage?: boolean;
}

export function EditContentModal({ 
  isOpen, 
  onClose, 
  output, 
  onSave,
  onGenerateImage,
  isGeneratingImage 
}: EditContentModalProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (output) {
      setContent(output.conteudo);
    }
  }, [output]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!output) return null;

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(output!.id, output!.agent, content);
      onClose();
    } catch (error) {
      console.error("Failed to save content", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isFullScreen ? "95vw" : "600px",
                height: isFullScreen ? "90vh" : "auto",
                maxWidth: "100%"
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Maximize2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Editar Conteúdo</h3>
                    <p className="text-xs text-slate-500">Formato: {output.agent} • ID: {output.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="rounded-full text-slate-400 hover:text-slate-600"
                  >
                    {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Título</label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{output.titulo}</p>
                  </div>
                  
                  <div className="flex flex-col h-full min-h-[300px]">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Conteúdo Gerado</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 w-full resize-none rounded-2xl border-none bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      placeholder="Edite o conteúdo aqui..."
                      style={{ minHeight: isFullScreen ? "calc(100% - 100px)" : "400px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <div>
                  {onGenerateImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-xl bg-white text-blue-600 border-blue-100 hover:bg-blue-50"
                      onClick={() => output && onGenerateImage(output.agent, output.tema_id)}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                      Gerar Nova Imagem
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || content === output.conteudo}
                    className="gap-2 bg-slate-900 hover:bg-slate-800"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
