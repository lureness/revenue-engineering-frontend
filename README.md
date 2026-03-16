# Lureness Frontend

Aplicação web em Next.js para a superfície pública e autenticada do produto.

## Rodar localmente

```bash
cp .env.example .env.local
npm run dev
```

## Variáveis de ambiente

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Estrutura inicial

- `/`: landing page pública
- `/app`: shell da área autenticada
- `src/lib/api/client.ts`: cliente HTTP apontando para o proxy interno do Next
- `src/app/api/backend/[...path]/route.ts`: camada BFF para cookies httpOnly e refresh
- `src/proxy.ts`: proteção inicial de rotas privadas no servidor

## Comandos

```bash
npm run dev
npm run test
npm run test:watch
npm run lint
npm run format
npm run build
```

## Testes de componente

O ambiente está pronto com `Vitest + jsdom + React Testing Library`.

```bash
npm run test
npm run test:watch
npm run test -- src/components/ui/button.test.tsx
```
