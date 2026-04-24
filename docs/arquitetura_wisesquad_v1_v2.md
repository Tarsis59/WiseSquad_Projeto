# WiseSquad - Arquitetura Atual (V1) e Roadmap (V2)

## O que já funciona (V1)

- Next.js App Router com API interna em TypeScript.
- Geração de 5 formatos (blog, linkedin, youtube, reels, shorts) com Groq.
- Base de conhecimento com cache em memória (`base_de_conhecimento.txt`).
- Persistência em tabelas separadas no Supabase.
- Histórico recente e visualização imediata na UI.
- CRUD de agentes customizados em `/configuracoes`.
- Geração de mídia:
  - `imagem_url` para blog/linkedin/reels/shorts.
  - `thumbnail_url` para youtube.
- Segurança inicial:
  - Basic Auth opcional via middleware para rotas sensíveis.

## Fluxo técnico atual

1. UI seleciona tema e agente.
2. `POST /api/generate` recebe `agent`, `temaId` e `force`.
3. Back-end valida tema e lock por `agent:temaId`.
4. Gera conteúdo com Groq + contexto da base.
5. Gera mídia com Nano Banana (fallback silencioso).
6. Salva no Supabase.
7. Retorna conteúdo para renderização imediata.

## Melhorias previstas (V2)

1. Controle de status de tema por etapa (`pendente`, `em_execucao`, `concluido`).
2. Fila persistente (Redis/Upstash) para alta concorrência.
3. Logs estruturados em tabela de auditoria (`agent_runs`).
4. Autenticação formal (Supabase Auth) com controle de perfis.
5. Dashboard operacional com métricas (latência, taxa de erro, reuso/idempotência).
6. Edição de agentes customizados (update).
