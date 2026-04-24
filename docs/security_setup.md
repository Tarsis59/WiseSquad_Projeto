# Segurança - Configuração Básica

## Basic Auth (opcional, recomendado para ambiente interno)

Adicione no `.env`:

```env
WISESQUAD_BASIC_AUTH_USER=admin
WISESQUAD_BASIC_AUTH_PASS=sua_senha_forte
```

Com essas variáveis definidas, o middleware protege:

- `/api/generate`
- `/api/custom-agents`
- `/api/admin/*`
- `/configuracoes`

Se as variáveis não estiverem definidas, o middleware libera acesso (modo protótipo local).

## Observação

Para produção, evoluir para autenticação com Supabase Auth e papéis (admin/editor/viewer).
