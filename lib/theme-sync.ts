import { supabase } from "@/lib/supabase";

const TITULOS: string[] = [
  "Distribuição de leads: como reduzir o tempo do gestor e acelerar o atendimento",
  "Como distribuir leads para vendedores sem planilha e sem confusão",
  "Distribuição automática de leads: vale a pena para equipes comerciais?",
  "Como parar de perder leads por erro na distribuição",
  "Gestão de leads: o impacto da distribuição automática na produtividade do time",
  "Como redistribuir leads antigos e recuperar oportunidades esquecidas",
  "Gestão de leads: como organizar sua operação comercial de verdade",
  "Gestão de leads no WhatsApp: como evitar contatos perdidos e follow-up falho",
  "Como fazer gestão de leads com mais controle e menos improviso",
  "Leads no vácuo: por que sua empresa perde vendas sem perceber",
  "Como saber se seus vendedores estão acompanhando todos os leads",
  "Gestão manual de leads: o custo invisível que trava suas vendas",
  "Follow-up de vendas: como vender mais sem depender da memória do vendedor",
  "Como estruturar um follow-up de vendas que não deixa lead esfriar",
  "Follow-up automático: quando usar e como não parecer robô",
  "Quantos leads sua empresa perde por falta de follow-up?",
  "Como criar uma cadência de follow-up no WhatsApp para vender mais",
  "Follow-up de leads antigos: como transformar base parada em receita",
  "CRM para WhatsApp: como profissionalizar o atendimento e vender mais",
  "Vale a pena integrar WhatsApp ao CRM?",
  "CRM com WhatsApp: o que muda na rotina do gestor comercial",
  "Como usar um CRM para WhatsApp sem travar a operação",
  "CRM para equipe de vendas: por que o WhatsApp sozinho não basta",
  "Histórico de conversas no CRM: por que isso aumenta o controle da gestão",
  "Produtividade em vendas: como fazer o time vender mais sem contratar mais gente",
  "Como aumentar a produtividade da equipe comercial com automação",
  "O que mais derruba a produtividade em vendas no dia a dia",
  "Como reduzir retrabalho no comercial e liberar o vendedor para fechar",
  "5 sinais de que sua equipe comercial está ocupada, mas não produtiva",
  "Como ganhar produtividade em vendas com dados em tempo real",
  "Treinamento de vendas: como reduzir a curva de aprendizado de novos vendedores",
  "Como treinar vendedores com situações reais e objeções do dia a dia",
  "Treinamento comercial: por que sua equipe demora tanto para performar",
  "Como acompanhar a evolução dos vendedores sem microgerenciar",
  "IA para treinamento de vendas: como usar sem perder o lado humano",
  "Como usar IA para ajudar vendedores a responder objeções e fechar mais",
];

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function syncThemesFromSheet() {
  const { data: existing, error: existingError } = await supabase
    .from("temas")
    .select("titulo");

  if (existingError) {
    throw new Error(`Erro ao verificar temas existentes: ${existingError.message}`);
  }

  const existingTitles = new Set(
    (existing ?? []).map((row) => normalizeTitle(typeof row.titulo === "string" ? row.titulo : ""))
  );

  const toInsert = TITULOS.filter((t) => !existingTitles.has(normalizeTitle(t))).map((titulo) => ({
    titulo,
    status: "pendente",
  }));

  if (!toInsert.length) {
    return { inserted: 0, skipped: TITULOS.length, parsed: TITULOS.length };
  }

  const { error: insertError } = await supabase.from("temas").insert(toInsert);

  if (insertError) {
    throw new Error(`Erro ao inserir temas: ${insertError.message}`);
  }

  return {
    inserted: toInsert.length,
    skipped: TITULOS.length - toInsert.length,
    parsed: TITULOS.length,
  };
}
