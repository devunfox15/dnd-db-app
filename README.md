# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Local Llama Chat Configuration

Campaign chat uses a local Ollama-compatible endpoint via `.env`:

```env
LLAMA_API_KEY="http://127.0.0.1:11434"
```

`LLAMA_API_KEY` is intentionally treated as a base URL in this project (legacy variable name).
