# English Daily — Fases de desenvolvimento

> **Data:** 2026-09-25 · Baseado no [PRD v0.3](PRD.md), na [PESQUISA](PESQUISA.md) e nos [ecrãs](https://claude.ai/artifact/UbyBqKTXzcjFF25NpLhCED).
> **Estado actual das fases:** ver [ESTADO.md](ESTADO.md).
> **Objetivo da v1:** publicar na **Google Play** uma app completa e gratuita, com anúncios, e custo mensal de 0 US$.

---

## Visão geral

| Fase | Nome | Entrega principal | Tamanho | Depende de |
|---|---|---|:-:|---|
| **F0** | Fundação | Projeto Expo + Supabase a funcionar num telemóvel Android | P | — |
| **F1** | Conteúdo | Catálogo de palavras com nível, temas, definições e traduções | G | F0 |
| **F2** | Introdução e conta | Os 4 passos da primeira abertura, teste de nível e login | M | F0, F1 |
| **F3** | Palavra do dia | Ecrã Hoje, página da palavra e notificações diárias | G | F1, F2 |
| **F4** | Dicionário | Pesquisa (offline + online), favoritos e histórico | M | F1, F3 |
| **F5** | Aprender | Revisão espaçada, treino, nível adaptativo, perfil | G | F3 |
| **F6** | Anúncios e definições | AdMob, consentimento, definições, apagar conta | M | F2–F5 |
| **F7** | Lançamento | Testes, teste fechado na Google Play, publicação | M | Todas |

**Tamanho:** P = pequeno · M = médio · G = grande (trabalho relativo, não semanas).

**Ordem de trabalho:** F0 → F1 → F2 → F3 → (F4 e F5 em paralelo) → F6 → F7.
O teste da Free Dictionary API (F1.1) faz-se **logo no início**, porque é o maior risco técnico.

---

## F0 — Fundação

**Objetivo:** ter a base pronta para as outras fases.

| # | Tarefa |
|---|---|
| F0.1 | Repositório Git em `PROJECTOS/EnglishDaily` (monorepo: `app/` + `supabase/` + `scripts/` + `docs/`) |
| F0.2 | App **Expo (SDK mais recente) + TypeScript + expo-router**, ESLint, Prettier |
| F0.3 | Tema visual dos ecrãs: cores (azul `#1E4FD8`), letras Fraunces + Figtree, espaçamentos, modo escuro |
| F0.4 | Traduções da interface (PT e EN) com `i18next` + `expo-localization` |
| F0.5 | Supabase: projeto **dev** e projeto **prod**, CLI, migrações versionadas no Git |
| F0.6 | **Development build** com EAS (compilação na nuvem, porque este PC não tem Android SDK) e instalação num telemóvel Android |
| F0.7 | Testes (Jest + React Native Testing Library) e verificação automática antes de cada commit |

**Pronto quando:** a app abre no telemóvel, lê algo da base de dados Supabase dev e muda entre PT e EN.

**Estado (2026-10-04):** F0.1–F0.5 e F0.7 feitos. Expo SDK 57, 4 separadores, ecrã Hoje com dados de exemplo, modo escuro, PT/EN, 18 testes, verificação antes de cada commit. Projeto Supabase de desenvolvimento ligado (ref `mgkvzekvxllrixlwvuie`, região eu-central-1), primeira migração aplicada (`app_config`) e a app lê dela (cartão "Ligação ao servidor" no Perfil).
**Falta:** F0.6, a primeira compilação EAS para Android. Precisa da conta Expo.

---

## F1 — Conteúdo

**Objetivo:** o catálogo de palavras que sustenta tudo o resto.

| # | Tarefa |
|---|---|
| F1.1 | **Teste da Free Dictionary API** com cerca de 200 palavras de vários níveis: medir quantas têm IPA, áudio, sinónimos e exemplos. Decide se é preciso o plano B (importar o Wiktionary) |
| F1.2 | Modelo de dados: `words`, `senses`, `examples`, `translations`, `topics`, `word_topics` + perfis e progresso dos utilizadores, com regras de acesso (RLS) |
| F1.3 | Script de importação: **CEFR-J** (A1–B2) + **Octanove** (C1–C2) + frequência de uso |
| F1.4 | Classificação das palavras por **tema** (uma vez só, com revisão manual de Dia a dia e Negócios) |
| F1.5 | Função no servidor `enrich-word`: vai à API de dicionário, guarda o resultado e devolve a ficha |
| F1.6 | Importação dos exemplos do **Tatoeba** (só texto, só as frases que contêm palavras do catálogo) |
| F1.7 | Função `translate`: **Azure** com o **Google** como reserva, e cache por par (palavra, língua) |
| F1.8 | Contador de caracteres traduzidos por mês, para não passar do limite grátis |

**Pronto quando:** qualquer palavra do catálogo devolve uma ficha completa (definição, IPA, exemplos, tradução em PT) e a segunda leitura vem da cache.

---

## F2 — Introdução e conta

| # | Tarefa |
|---|---|
| F2.1 | Ecrãs 1–3: língua nativa, nível, temas e horário |
| F2.2 | **Teste de nível:** algoritmo adaptativo de 15 palavras, que termina mais cedo se a pessoa falhar várias seguidas, e ecrã de resultado |
| F2.3 | Pedido de permissão de notificações, com a explicação antes do pedido do sistema |
| F2.4 | Login: **Google** + **e-mail com link de acesso** (Supabase Auth) |
| F2.5 | Guardar as escolhas no perfil e sincronizá-las |

**Pronto quando:** uma pessoa nova instala a app, faz a introdução e o teste, cria conta e reencontra as escolhas noutro telemóvel.

---

## F3 — Palavra do dia

| # | Tarefa |
|---|---|
| F3.1 | Função `pick-daily-words`: 80% do nível atual, 20% do seguinte, temas escolhidos, sem palavras já vistas |
| F3.2 | A app descarrega as palavras dos **próximos 7 dias** e guarda-as em **SQLite** (offline) |
| F3.3 | **Notificações locais agendadas** com as ações "Já conheço" e "Guardar", reagendadas quando a app abre |
| F3.4 | Ecrã **Hoje**: palavra do dia, revisão pendente, progresso |
| F3.5 | **Página da palavra**: áudio da fonte ou voz do telemóvel (`expo-speech`), exemplos, combinações, sinónimos, créditos |
| F3.6 | Partilhar a palavra como imagem |
| F3.7 | Guia "As notificações não chegam?" para fabricantes que fecham apps (Xiaomi, Samsung…) |

**Pronto quando:** durante 7 dias seguidos a notificação chega à hora certa, mesmo com a app fechada e sem internet nessa altura.

---

## F4 — Dicionário

| # | Tarefa |
|---|---|
| F4.1 | Pesquisa com sugestões: **primeiro no SQLite**, depois online |
| F4.2 | Pacote base do nível descarregado na instalação, para pesquisar offline |
| F4.3 | Indicação "Offline" / "Online" e mensagem clara quando não há rede |
| F4.4 | Favoritos e histórico, sincronizados com a conta |
| F4.5 | Adicionar qualquer palavra pesquisada à revisão |

---

## F5 — Aprender

| # | Tarefa |
|---|---|
| F5.1 | Revisão espaçada com **FSRS** (`ts-fsrs`) e sincronização do estado de cada palavra |
| F5.2 | Treino: escolher o significado, completar a frase, autoavaliação |
| F5.3 | **Nível adaptativo:** sobe com 85% ou mais de acertos e palavras dominadas, desce abaixo de 60%, e avisa a pessoa |
| F5.4 | Dias seguidos (com 1 dia de folga), palavras aprendidas e dominadas |
| F5.5 | Ecrã **Perfil** com estatísticas e o gráfico da semana |
| F5.6 | Lembrete de revisão (notificação às 20:00 se houver revisões) |

---

## F6 — Anúncios e definições

| # | Tarefa |
|---|---|
| F6.1 | **AdMob**: banner no topo de Hoje, Dicionário e Perfil, sem banner nos ecrãs proibidos |
| F6.2 | Menu ⋯ com "Ocultar anúncio" (até a app voltar a abrir) |
| F6.3 | **Anúncios com recompensa**: ajuda no treino, treino extra, recuperar os dias seguidos, 24 h sem banners |
| F6.4 | **Consentimento** (UMP) para a Europa e outros casos obrigatórios |
| F6.5 | Ecrã **Definições** completo |
| F6.6 | **Apagar conta** e **exportar os dados** dentro da app |
| F6.7 | Ecrã "Créditos e licenças" e política de privacidade publicada |

---

## F7 — Lançamento (Android)

| # | Tarefa |
|---|---|
| F7.1 | Testes de ponta a ponta nos fluxos principais; acessibilidade (tamanho de letra, leitor de ecrã) |
| F7.2 | Desempenho: abertura em menos de 2 s, ficha em cache em menos de 300 ms |
| F7.3 | Conta **Google Play Console** (25 US$), ficha da loja ("English Daily: Palavra do Dia"), imagens, classificação etária |
| F7.4 | **Teste fechado:** cerca de 12 testadores durante 14 dias (regra das contas novas) |
| F7.5 | Publicação. Acompanhar os erros, os custos (Supabase, tradução) e as receitas do AdMob |

---

## O que só tu podes fazer

Eu não posso criar contas, aceitar termos nem introduzir dados de pagamento. É preciso criar:

| Conta | Quando | Nota |
|---|---|---|
| **Expo** (expo.dev) | F0 | Grátis |
| **Supabase** | F0 | Grátis. Depois cria-se um projeto dev e um prod |
| **Azure** (Translator F0) | F1 | O nível F0 é grátis, mas o registo na Azure pode pedir um cartão para verificação |
| **Google Cloud** (Translation, reserva) | F1 | Opcional no início |
| **AdMob** | F6 | Grátis |
| **Google Play Console** | F7 | 25 US$, uma vez só. Começar a juntar os ~12 testadores durante a F5 |

**Ferramentas neste PC:** Node 24, npm 11 e Git já estão instalados. Não há Android SDK nem Java, por isso as compilações são feitas **na nuvem com EAS** e a app é testada num telemóvel Android real.

---

## Próximo passo

Começar a **F0**: criar o repositório e o projeto Expo, e aplicar o tema visual. Criar as contas **Expo** e **Supabase** antes da tarefa F0.5.
