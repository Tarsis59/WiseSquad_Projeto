$env:ANTHROPIC_API_KEY="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"
$env:ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1"
$model="qwen/qwen3-coder:free"

Write-Host "Iniciando Claude Code com OpenRouter..." -ForegroundColor Cyan
Write-Host "Modelo: $model" -ForegroundColor Yellow

claude --bare --model $model
