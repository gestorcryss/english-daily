# English Daily

App móvel (Android primeiro, depois iPhone) para aprender vocabulário de inglês: uma palavra por dia, à medida do nível e dos temas de cada pessoa, com tradução na língua nativa e revisão espaçada.

## Estrutura

| Pasta | O quê |
|---|---|
| `app/` | App Expo (React Native + TypeScript + expo-router) |
| `supabase/` | Base de dados: migrações e funções no servidor |
| `scripts/` | Construção do catálogo de palavras (ver «Reconstruir o catálogo» em docs/ESTADO.md) |
| `docs/` | [Estado actual](docs/ESTADO.md), [PRD](docs/PRD.md), [Pesquisa](docs/PESQUISA.md), [Fases](docs/ROADMAP.md) |

Ecrãs desenhados: https://claude.ai/artifact/UbyBqKTXzcjFF25NpLhCED

## Começar

```bash
cd app
npm install          # também ativa a verificação antes de cada commit
cp .env.example .env.local   # e preencher com os dados do Supabase
npm run web          # pré-visualização rápida no browser
npm start            # servidor para o development build no telemóvel
```

## Verificações

```bash
cd app
npm run check        # tipos + lint + testes (corre também antes de cada commit)
```

## Development build (Android)

Este PC não tem Android SDK: as compilações são feitas na nuvem com EAS.

```bash
cd app
npx eas-cli@latest build --profile preview --platform android      # APK que funciona sozinho
npx eas-cli@latest build --profile development --platform android  # APK ligado ao `npm start`
```

No PowerShell, usar `npx.cmd` em vez de `npx`.
