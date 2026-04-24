import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="size-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <Loader2 className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
        </div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Carregando Dashboard...</p>
      </div>
    </div>
  );
}
