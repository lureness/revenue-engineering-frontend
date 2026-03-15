# Lureness Frontend

Aplicação web em Next.js para a superfície pública e autenticada do produto.

## Rodar localmente

```bash
cp .env.example .env.local
npm run dev
```

## Variáveis públicas

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Estrutura inicial

- `/`: landing page pública
- `/app`: shell da área autenticada
- `src/lib/api/client.ts`: cliente HTTP base para integração com a API
- `src/lib/auth/session.ts`: persistência local de sessão para o próximo slice

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
