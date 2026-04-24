import { groq } from "@/lib/groq";
import { getKnowledgeContext } from "@/lib/knowledge";
import { supabase } from "@/lib/supabase";
import type { AgentType, GeneratedRecord, Tema } from "@/lib/types";

type AgentConfig = {
  label: string;
  table: string;
  prompt: (titulo: string) => string;
};

export const agentConfigs: Record<string, AgentConfig> = {
  blog: {
    label: "Blog",
    table: "blog_posts",
    prompt: (titulo) =>
      `Crie um Post de Blog completo com base no tema: "${titulo}". O texto deve ser pronto para publicação, claro, útil e alinhado ao contexto fornecido.`,
  },
  linkedin: {
    label: "LinkedIn",
    table: "linkedin_posts",
    prompt: (titulo) =>
      `Crie um post viral para o LinkedIn sobre o tema "${titulo}". O post deve ter um gancho forte na primeira linha, parágrafos curtos, uso estratégico de emojis e uma chamada para ação (CTA) no final focada em gestores de vendas.`,
  },
  youtube: {
    label: "YouTube",
    table: "youtube_scripts",
    prompt: (titulo) =>
      `Crie um roteiro completo de vídeo para o YouTube sobre o tema "${titulo}". Estruture com: 1) Gancho de 15 segundos, 2) Vinheta, 3) Introdução do problema, 4) Três pontos de solução práticos, 5) Chamada para ação final.`,
  },
  reels: {
    label: "Reels",
    table: "reels_copies",
    prompt: (titulo) =>
      `Crie um roteiro dinâmico e copy para um Reels do Instagram (máximo 45 segundos) sobre o tema "${titulo}". O roteiro deve ter indicação visual (o que aparece na tela) e o texto falado (dinâmico, rápido, focado na dor).`,
  },
  shorts: {
    label: "Shorts",
    table: "short_video_scripts",
    prompt: (titulo) =>
      `Crie um roteiro de vídeo curto (máximo 60 segundos) para YouTube Shorts sobre o tema "${titulo}". Use o formato Problema -> Agitação -> Solução rápida.`,
  },
  tiktok: {
    label: "TikTok",
    table: "tiktok_scripts",
    prompt: (titulo) =>
      `Crie um roteiro completo de vídeo para TikTok (máximo 60 segundos) sobre o tema "${titulo}". Estruture com: 1) Gancho viral (0-3s), 2) Vinheta (3-5s), 3) Problema (5-20s), 4) Solução com WiseChats (20-45s), 5) Prova social (45-50s), 6) CTA claro (50-60s). Inclua instruções visuais (o que aparece na tela), instruções de áudio (música, efeitos), hashtags relevantes e legenda completa. Use tom energético, profissional mas acessível, com provas sociais reais da WiseChats.`,
  },
  substack: {
    label: "Substack",
    table: "substack_posts",
    prompt: (titulo) =>
      `Crie um artigo aprofundado para newsletter no Substack sobre o tema "${titulo}". O tom deve ser analítico e estratégico, com dados concretos, estudos de caso do mercado de franquias e uma reflexão final que posicione a WiseChats como referência em gestão comercial com IA.`,
  },
};

const executionLocks = new Map<string, Promise<unknown>>();

export function normalizeRecord(agent: AgentType, row: Record<string, unknown>): GeneratedRecord {
  const imagemUrl = typeof row.imagem_url === "string" ? row.imagem_url : null;
  const thumbnailUrl = typeof row.thumbnail_url === "string" ? row.thumbnail_url : null;

  return {
    id: String(row.id ?? ""),
    tema_id: String(row.tema_id ?? ""),
    titulo: String(row.titulo ?? ""),
    conteudo: String(row.conteudo ?? ""),
    imagem_url: imagemUrl || thumbnailUrl,
    thumbnail_url: thumbnailUrl,
    media_url: imagemUrl || thumbnailUrl,
    created_at: row.created_at ? String(row.created_at) : null,
    agent: agent as AgentType,
    status: (row.conteudo && String(row.conteudo).includes("[CONFIRMED]")) ? "confirmed" : "draft",
  };
}

type GeneratedMedia = {
  imagem_url?: string | null;
  thumbnail_url?: string | null;
};

// NOTE: Nano Banana AI é a API principal de geração de imagens.
// Pollinations.ai é usado como fallback via URL pública.
export async function generateImageWithNanoBanana(prompt: string, aspectRatio = "2:1"): Promise<string | null> {
  const rawKey = process.env.NANO_BANANA_API_KEY;
  if (!rawKey) {
    console.warn("[wisesquad.generate] NANO_BANANA_API_KEY não configurada. Pulando geração de imagem.");
    return null;
  }

  // Limpa a chave de possíveis aspas ou espaços extras do .env
  const apiKey = rawKey.replace(/['"]/g, "").trim();
  const baseUrl = "https://api.nanobananaapi.ai/api/v1/nanobanana";

  try {
    // 1. Submeter tarefa de geração
    const submitRes = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey, // Fallback para algumas versões da API
      },
      body: JSON.stringify({
        prompt,
        type: "TEXTTOIAMGE", // Mantendo a grafia da documentação oficial
        numImages: 1,
        imageUrls: [],
        aspectRatio,
        resolution: "1K",
        outputFormat: "jpg",
      }),
    });

    const submitJson = (await submitRes.json()) as { code?: number; msg?: string; data?: { taskId?: string } };
    if (!submitRes.ok || submitJson.code !== 200) {
      // Log silencioso para não assustar o usuário no terminal
      console.debug(`[wisesquad.image] Nano Banana indisponível (Code: ${submitRes.status}). Tentando próximo provedor...`);
      return null;
    }

    const taskId = submitJson.data?.taskId;
    if (!taskId) return null;

    // 2. Polling até conclusão (máximo 60s)
    const maxWait = 60000;
    const pollInterval = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${baseUrl}/record-info?taskId=${taskId}`, {
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      const statusJson = (await statusRes.json()) as {
        successFlag?: number;
        errorMessage?: string;
        response?: { resultImageUrl?: string };
      };

      if (statusJson.successFlag === 1 && statusJson.response?.resultImageUrl) {
        return statusJson.response.resultImageUrl;
      }

      if (statusJson.successFlag === 2 || statusJson.successFlag === 3) {
        return null;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function generateImageWithPollinationsAPI(prompt: string, width = 1024, height = 512): Promise<string | null> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  
  // Usamos o modelo FLUX que é o estado da arte para realismo e design
  const model = "flux";
  const seed = Math.floor(Math.random() * 1000000);
  
  try {
    // URL otimizada para qualidade máxima e sem logos
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}&enhance=true`;
    
    // Verificamos se a imagem é gerável (opcional, mas Pollinations gera on-the-fly)
    return url;
  } catch (err) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=42&nologo=true`;
  }
}

async function generateMediaForAgent(agent: AgentType, temaTitulo: string, useNanoBanana = true): Promise<GeneratedMedia> {
  // Prompts de Engenharia Elite para resultados profissionais
  const promptMap: Record<AgentType, string> = {
    blog: `High-end corporate blog header, topic: "${temaTitulo}", cinematic lighting, minimalist aesthetic, 8k resolution, professional photography, clean background, no text`,
    linkedin: `Professional LinkedIn business post, topic: "${temaTitulo}", modern office setting, diverse team collaborating, high quality, corporate style, bright and airy, no text`,
    youtube: `Epic YouTube thumbnail background, topic: "${temaTitulo}", high contrast, vibrant colors, dramatic lighting, professional digital art, 16:9, no text`,
    reels: `Cinematic vertical cover for Instagram Reels, topic: "${temaTitulo}", dynamic motion blur background, luxury aesthetic, vibrant colors, professional, no text`,
    shorts: `Minimalist vertical background for YouTube Shorts, topic: "${temaTitulo}", bold colors, clean lines, high quality, professional design, no text`,
    substack: `Elegant editorial illustration for Substack, topic: "${temaTitulo}", minimalist design, soft pastel colors, professional digital art, clean typography feel, no text`,
  };

  const dimensionMap: Record<AgentType, { w: number; h: number }> = {
    blog: { w: 1024, h: 512 },
    linkedin: { w: 1024, h: 512 },
    youtube: { w: 1280, h: 720 },
    reels: { w: 720, h: 1280 },
    shorts: { w: 720, h: 1280 },
    substack: { w: 1024, h: 512 },
  };

  const prompt = promptMap[agent];
  const dims = dimensionMap[agent];

  let imageUrl: string | null = null;

  // PLANO INFALÍVEL: Tentativa em cascata
  try {
    if (useNanoBanana) {
      // 1. Tenta Nano Banana (Silent)
      imageUrl = await generateImageWithNanoBanana(prompt, agent === "youtube" ? "16:9" : "2:1");
    }
    
    if (!imageUrl) {
      // 2. Se falhar ou não usar, vai de Pollinations FLUX (Elite)
      imageUrl = await generateImageWithPollinationsAPI(prompt, dims.w, dims.h);
    }
  } catch (e) {
    // 3. Fallback final
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${dims.w}&height=${dims.h}&nologo=true`;
  }

  const finalUrl = imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${dims.w}&height=${dims.h}&nologo=true`;

  if (agent === "youtube") return { thumbnail_url: finalUrl };
  return { imagem_url: finalUrl };
}

// Atualiza status do tema para "concluido" apenas se todos os 6 agentes foram gerados
async function updateThemeStatus(temaId: string) {
  const { data: tema } = await supabase.from("temas").select("id, titulo").eq("id", temaId).maybeSingle();
  if (!tema) return;

  const agents = Object.keys(agentConfigs) as AgentType[];
  let completedCount = 0;

  await Promise.all(
    agents.map(async (agent) => {
      const config = agentConfigs[agent];
      
      // 1. Tentar por ID
      let { count } = await supabase
        .from(config.table)
        .select("*", { count: "exact", head: true })
        .eq("tema_id", temaId);

      // 2. Se não achou por ID, tentar por título (cura)
      if (!count || count === 0) {
        const { data: orphans } = await supabase
          .from(config.table)
          .select("id")
          .eq("titulo", tema.titulo)
          .limit(1);
        
        if (orphans && orphans.length > 0) {
          // Cura: vincula ao ID correto
          await supabase.from(config.table).update({ tema_id: temaId }).eq("id", orphans[0].id);
          count = 1;
        }
      }

      if (count && count > 0) {
        completedCount++;
      }
    })
  );

  const newStatus = completedCount === agents.length ? "concluido" : "pendente";
  await supabase.from("temas").update({ status: newStatus }).eq("id", temaId);
  console.log(`[wisesquad.sync] Tema "${tema.titulo}" (${temaId}): ${completedCount}/${agents.length} -> ${newStatus}`);
}

// Fallback: URL pública do Pollinations (sem autenticação)
export function buildPollinationsUrl(prompt: string, width = 640, height = 320): string {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: "42",
    nologo: "true",
    enhance: "false",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function logExecution(event: string, payload: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      scope: "wisesquad.generate",
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}

function withExecutionLock<T>(key: string, fn: () => Promise<T>) {
  const existing = executionLocks.get(key) as Promise<T> | undefined;
  if (existing) {
    throw new Error("Já existe uma geração em andamento para este tema e agente.");
  }

  const promise = fn().finally(() => {
    executionLocks.delete(key);
  });

  executionLocks.set(key, promise);
  return promise;
}

export async function fetchThemesWithProgress(limit = 100): Promise<(Tema & { completed_count: number; total_count: number })[]> {
  const { data: themesData, error: themesError } = await supabase
    .from("temas")
    .select("id, titulo, status")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (themesError) {
    throw new Error(`Erro ao buscar temas: ${themesError.message}`);
  }

  const themes = themesData ?? [];
  if (themes.length === 0) return [];

  const themeIds = themes.map((t) => String(t.id));
  const agents = Object.keys(agentConfigs) as AgentType[];

  // Inicializa o mapa de contagem para cada tema
  const countsMap: Record<string, number> = {};
  themeIds.forEach((id) => {
    countsMap[id] = 0;
  });

  // Para cada tabela de agente, buscamos quais temas possuem registros de uma vez só (bulk)
  // Isso reduz drasticamente o número de queries de O(N*6) para O(6)
  await Promise.all(
    agents.map(async (agent) => {
      const config = agentConfigs[agent];
      const { data, error } = await supabase
        .from(config.table)
        .select("tema_id")
        .in("tema_id", themeIds);

      if (!error && data) {
        // Usamos um Set para contar apenas uma vez por tema nesta tabela
        const uniqueThemesInTable = new Set(data.map((d) => String(d.tema_id)));
        uniqueThemesInTable.forEach((tid) => {
          if (countsMap[tid] !== undefined) {
            countsMap[tid]++;
          }
        });
      }
    })
  );

  return themes.map((tema) => {
    const id = String(tema.id);
    const completed = countsMap[id] ?? 0;
    return {
      id,
      titulo: String(tema.titulo),
      status: completed === agents.length ? "concluido" : "pendente",
      completed_count: completed,
      total_count: agents.length,
    };
  });
}


export async function fetchPendingTheme(): Promise<Tema | null> {
  const temas = await fetchThemesWithProgress(10);
  return temas.find(t => t.completed_count < t.total_count) ?? null;
}

export async function fetchThemeById(temaId: string | number): Promise<Tema | null> {
  const { data, error } = await supabase
    .from("temas")
    .select("id, titulo, status")
    .eq("id", temaId)
    .maybeSingle();
  if (error) {
    throw new Error(`Erro ao buscar tema ${temaId}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: String(data.id),
    titulo: String(data.titulo),
    status: typeof data.status === "string" ? data.status : null,
  };
}

async function findExistingOutput(agent: AgentType, temaId: string) {
  const config = agentConfigs[agent];
  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq("tema_id", temaId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar duplicidade em ${config.table}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeRecord(agent, data as Record<string, unknown>);
}

async function getAgentConfig(agent: AgentType): Promise<AgentConfig> {
  // Check native agents first
  if (agentConfigs[agent]) {
    return agentConfigs[agent];
  }

  // Check custom agents in database
  const { data, error } = await supabase
    .from("agentes_customizados")
    .select("id, nome, prompt_sistema")
    .eq("id", agent)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Agente ${agent} não encontrado.`);
  }

  return {
    label: data.nome,
    table: "custom_outputs",
    prompt: (titulo) =>
      `${data.prompt_sistema}\n\nAplique isso ao tema: "${titulo}". Use o contexto da base de conhecimento fornecida.`,
  };
}

export async function generateContentForAgent(agent: AgentType, options?: { temaId?: string | number | null; force?: boolean; useNanoBanana?: boolean }) {
  const config = await getAgentConfig(agent);
  const rawTemaId = options?.temaId;
  const requestedTemaId = typeof rawTemaId === "string" ? rawTemaId.trim() : rawTemaId;
  const useNanoBanana = options?.useNanoBanana ?? true;
  const forceGeneration = options?.force ?? false;
  const tema = requestedTemaId ? await fetchThemeById(requestedTemaId) : await fetchPendingTheme();

  if (!tema) {
    return {
      agent,
      label: config.label,
      empty: true,
      message: "Nenhum tema pendente encontrado.",
    };
  }

  const lockKey = `${agent}:${tema.id}`;
  return withExecutionLock(lockKey, async () => {
    logExecution("start", { agent, temaId: tema.id, forceGeneration });

    if (!forceGeneration) {
      const existing = await findExistingOutput(agent, tema.id);
      if (existing) {
        logExecution("deduplicated", { agent, temaId: tema.id, outputId: existing.id });
        return {
          agent,
          label: config.label,
          empty: false,
          reused: true,
          tema,
          record: existing,
        };
      }
    }

    const contexto = await getKnowledgeContext();

    // Retry com backoff para lidar com rate limit da Groq
    let completion;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Você é redator especialista da WiseChats.

Siga rigorosamente o tom de voz, padrões de escrita, regras editoriais e diretrizes abaixo.

BASE DE CONHECIMENTO DA WISECHATS (USE OS DADOS ABAIXO NOS CONTEÚDOS):
${contexto}

REGRAS DE REDAÇÃO:
1. Use provas sociais reais: CDT Barueri (68% conversão de inadimplentes), CDT Irajá (500+ reativações), Real Up RJ (2.500 reativações, 3% conversão).
2. Aplique o framework SPIN de vendas: Situação -> Problema -> Implicação -> Necessidade de Solução.
3. O tom é profissional, consultivo, empático, firme e orientado a dados.
4. O foco é na DOR do gestor de franquias Cartão de Todos, não em "falar de ferramentas".
5. A IA da WiseChats AMPLIA o vendedor humano; ela qualifica e entrega o lead pronto.
6. Mencione os planos e preços quando relevante: Essencial R$1.800/mês (2 agentes), Avançado R$3.150/mês (4 agentes), Premium R$4.500/mês (6 agentes).
7. Use o argumento de ROI: 6 agentes IA = R$4.500/mês vs 6 vendedores humanos = ~R$18.000/mês + encargos.
8. O especialista Carlos Eduardo possui 6 anos de experiência com CDT e R$10M+ em gestão de tráfego para 70 franquias.`,
            },
            {
              role: "user",
              content: config.prompt(tema.titulo),
            },
          ],
        });
        break; // sucesso, sai do loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          const delay = (attempt + 1) * 2000;
          console.warn(`[wisesquad.generate] ${agent}: Groq tentativa ${attempt + 1} falhou, retry em ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!completion) {
      throw new Error(`Groq falhou após 3 tentativas: ${lastError?.message ?? "unknown"}`);
    }

    const conteudoGerado = completion.choices?.[0]?.message?.content?.trim();
    console.log(`[wisesquad.generate] ${agent}: texto gerado (${conteudoGerado?.length ?? 0} chars)`);

    if (!conteudoGerado) {
      throw new Error("A Groq não retornou conteúdo para o post.");
    }

    let media: GeneratedMedia;
    try {
      media = await generateMediaForAgent(agent, tema.titulo, useNanoBanana);
    } catch (err) {
      console.warn(`[wisesquad.generate] Erro ao gerar imagem para ${agent}, usando fallback:`, err instanceof Error ? err.message : err);
      const fallbackUrl = buildPollinationsUrl(
        `professional ${agent} image about "${tema.titulo}", corporate modern style, no text`,
        agent === "youtube" ? 1280 : 640,
        agent === "youtube" ? 720 : 320
      );
      media = agent === "youtube" ? { thumbnail_url: fallbackUrl } : { imagem_url: fallbackUrl };
    }

    const { data, error } = await supabase
      .from(config.table)
      .insert({
        tema_id: tema.id,
        titulo: tema.titulo,
        ...(config.table === "custom_outputs" ? { agent_id: agent } : {}),
        conteudo: conteudoGerado,
        ...media,
      })
      .select("*")
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Erro ao salvar conteúdo em ${config.table}: ${error.message}`);
    }

    // Atualiza status do tema (só muda para concluido se todos os 6 agentes foram gerados)
    await updateThemeStatus(tema.id);

    logExecution("success", { agent, temaId: tema.id, table: config.table, outputId: data.id });

    return {
      agent,
      label: config.label,
      empty: false,
      reused: false,
      tema,
      record: normalizeRecord(agent, data as Record<string, unknown>),
    };
  });
}

export async function generateAllFormatsForTheme(temaId: string) {
  const agents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "tiktok", "substack"];
  const results: Array<{ success: boolean; [key: string]: unknown }> = [];

  console.log(`[wisesquad.generate] Iniciando geração em massa para tema ${temaId} (${agents.length} agentes)`);

  // Processa em batches de 2 para evitar rate limit da API Groq
  // Usa Pollinations URL (instantâneo) para não travar o request
  const batchSize = 2;
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    console.log(`[wisesquad.generate] Processando batch ${i / batchSize + 1}: ${batch.join(", ")}`);
    const batchResults = await Promise.allSettled(
      batch.map((agent) => generateContentForAgent(agent, { temaId, force: true, useNanoBanana: false }))
    );
    for (const res of batchResults) {
      if (res.status === "fulfilled") {
        console.log(`[wisesquad.generate] Resultado fulfilled:`, res.value);
        results.push({ success: true, ...res.value });
      } else {
        console.error(`[wisesquad.generate] Resultado rejected:`, res.reason);
        results.push({ success: false, error: res.reason });
      }
    }
    // Pequeno delay entre batches para respeitar rate limits
    if (i + batchSize < agents.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[wisesquad.generate] Geração em massa concluída. ${results.length} resultados, ${results.filter(r => r.success && !r.empty).length} com sucesso`);

  // Dispara upgrade de imagens com Nano Banana em background (fire-and-forget)
  upgradeImagesWithNanoBanana(temaId).catch((err) => {
    console.warn("[wisesquad.generate] Erro no upgrade de imagens em background:", err instanceof Error ? err.message : err);
  });

  return results;
}

// Atualiza imagens no banco com URLs do Nano Banana (rodando em background)
async function upgradeImagesWithNanoBanana(temaId: string) {
  const agents: AgentType[] = ["blog", "linkedin", "youtube", "reels", "shorts", "tiktok", "substack"];

  for (const agent of agents) {
    try {
      const config = agentConfigs[agent];
      if (!config) continue;

      const { data: row } = await supabase
        .from(config.table)
        .select("id, titulo")
        .eq("tema_id", temaId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!row) continue;

      const aspectRatioMap: Record<AgentType, string> = {
        blog: "2:1", linkedin: "2:1", youtube: "16:9",
        reels: "9:16", shorts: "9:16", tiktok: "9:16", substack: "2:1",
      };

      const promptMap: Record<AgentType, string> = {
        blog: `professional blog header image about "${row.titulo}", corporate modern style, clean typography, soft gradient background, no text`,
        linkedin: `professional linkedin social media post image about "${row.titulo}", corporate modern style, people working with technology, clean design, no text`,
        youtube: `youtube thumbnail about "${row.titulo}", bold colors, high contrast, modern marketing digital style, professional, no text overlays, 16:9`,
        reels: `instagram reels cover about "${row.titulo}", vibrant vertical social media style, bold modern colors, professional, no text`,
        shorts: `youtube shorts thumbnail about "${row.titulo}", dynamic minimalist style, bold colors, vertical composition, no text`,
        tiktok: `tiktok viral video cover about "${row.titulo}", energetic vertical social media style, vibrant colors, dynamic composition, trendy aesthetic, no text`,
        substack: `editorial newsletter header about "${row.titulo}", minimalist corporate design, elegant typography, soft background, no text`,
      };

      const nanoUrl = await generateImageWithNanoBanana(promptMap[agent], aspectRatioMap[agent]);
      
      let imageUrl = nanoUrl;
      if (!imageUrl) {
        console.log(`[wisesquad.generate] Nano Banana falhou no background para ${agent}. Usando Pollinations PRO...`);
        // Busca dimensões para o fallback
        const dims = { w: 1024, h: 512 }; 
        if (agent === "youtube") { dims.w = 1280; dims.h = 720; }
        if (agent === "reels" || agent === "shorts") { dims.w = 512; dims.h = 1024; }
        
        imageUrl = await generateImageWithPollinationsAPI(promptMap[agent], dims.w, dims.h);
      }

      if (!imageUrl) continue;

      const updateField = agent === "youtube" ? { thumbnail_url: imageUrl } : { imagem_url: imageUrl };
      await supabase.from(config.table).update(updateField).eq("id", row.id);
      console.log(`[wisesquad.generate] ${agent}: imagem atualizada com sucesso (Nano ou Fallback)`);
    } catch (err) {
      console.warn(`[wisesquad.generate] Falha ao atualizar imagem ${agent}:`, err instanceof Error ? err.message : err);
    }
  }
}

export async function countOutputsForTheme(temaId: string): Promise<{ total: number; completed: number }> {
  const agents = Object.keys(agentConfigs) as AgentType[];
  let completed = 0;

  await Promise.all(
    agents.map(async (agent) => {
      const config = agentConfigs[agent];
      const { count, error } = await supabase
        .from(config.table)
        .select("*", { count: "exact", head: true })
        .eq("tema_id", temaId);

      if (!error && count && count > 0) {
        completed++;
      }
    })
  );

  return { total: agents.length, completed };
}

export async function fetchRecentOutputs(limitPerAgent = 5): Promise<GeneratedRecord[]> {
  const results = await Promise.all(
    (Object.keys(agentConfigs) as AgentType[]).map(async (agent) => {
      const config = agentConfigs[agent];
      try {
        const { data, error } = await supabase
          .from(config.table)
          .select("*")
          .order("id", { ascending: false })
          .limit(limitPerAgent);

        if (error) {
          console.warn(`[wisesquad.fetchRecentOutputs] Tabela ${config.table} não encontrada ou erro: ${error.message}`);
          return [];
        }

        return (data ?? []).map((row) => normalizeRecord(agent, row as Record<string, unknown>));
      } catch (err) {
        console.warn(`[wisesquad.fetchRecentOutputs] Erro ao buscar histórico de ${config.label}:`, err instanceof Error ? err.message : err);
        return [];
      }
    })
  );

  return results
    .flat()
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return Number(b.id) - Number(a.id);
    })
    .slice(0, 20);
}

export async function listPendingThemes(): Promise<Tema[]> {
  const { data, error } = await supabase
    .from("temas")
    .select("*")
    .eq("status", "pendente")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar temas pendentes: ${error.message}`);
  }

  return (data ?? []) as Tema[];
}

export async function syncAllThemesStatus() {
  console.log("[wisesquad.sync] Iniciando sincronização global de status dos temas...");
  
  const { data: themes, error } = await supabase
    .from("temas")
    .select("id, status");

  if (error || !themes) {
    console.error("[wisesquad.sync] Erro ao buscar temas para sincronização:", error);
    return;
  }

  console.log(`[wisesquad.sync] Verificando ${themes.length} temas...`);

  // Processa em batches pequenos para não estourar conexões
  const batchSize = 5;
  for (let i = 0; i < themes.length; i += batchSize) {
    const batch = themes.slice(i, i + batchSize);
    await Promise.all(batch.map(theme => updateThemeStatus(theme.id)));
    console.log(`[wisesquad.sync] Processados ${Math.min(i + batchSize, themes.length)}/${themes.length} temas.`);
  }

  console.log("[wisesquad.sync] Sincronização global concluída.");
}
