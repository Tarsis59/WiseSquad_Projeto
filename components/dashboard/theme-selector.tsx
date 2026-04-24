import { Badge } from "@/components/ui/badge";
import type { Tema } from "@/lib/types";

interface ThemeSelectorProps {
  selectedTheme: Tema | null;
}

export function ThemeSelector({ selectedTheme }: ThemeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge className="gap-2">
        <span className="size-2 rounded-full bg-blue-600" />
        Tema ativo
      </Badge>
      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
        {selectedTheme?.titulo ?? "Nenhum tema pendente"}
      </div>
    </div>
  );
}
