# English Daily — Documento de Requisitos (PRD) v0.3

> **Nome:** English Daily. Nas lojas deve levar um subtítulo que o distinga (ex.: "English Daily: Palavra do Dia"), porque há apps com nomes parecidos.
> **Data:** 2026-09-25 · **Versão:** v0.3 (nome, lançamento Android primeiro, interface PT/EN) · **Estado:** Aprovado para desenho de ecrãs
> **Autor:** Raimundo Cristóvão

---

## 1. Visão

Uma aplicação móvel (Android e iPhone) para aprender vocabulário em inglês. Todos os dias a pessoa recebe uma notificação com uma **palavra nova**, escolhida conforme o seu **nível** e os seus **temas de interesse**. Cada palavra vem com exemplos em frases, pronúncia e tradução na **língua nativa** da pessoa. A app funciona também como **dicionário completo** e usa **revisão espaçada** para que as palavras não se esqueçam.

**Frase-resumo:** *"Uma palavra por dia, à tua medida, que não esqueces."*

### 1.1 O que a diferencia
1. **Palavra do dia personalizada.** Tem em conta o nível (A1–C2) e os temas de cada pessoa. Não é igual para todos.
2. **O nível sobe sozinho** com base no desempenho real.
3. **Revisão espaçada.** As palavras antigas voltam no momento certo.
4. **Tradução na língua nativa**, seja ela qual for, e não só em português.
5. **Aprende-se na própria notificação**, com os botões "Já conheço" e "Guardar".
6. **Gratuita, com anúncios que não atrapalham.** Há um banner que se pode fechar e vídeos opcionais que dão ajudas.

### 1.2 Público-alvo
Público em geral: pessoas que falam outras línguas e querem aprender vocabulário de inglês, do iniciante ao avançado. A app tem de ter qualidade profissional e poder ser publicada nas lojas (Google Play e App Store).

---

## 2. Âmbito por versão

| Funcionalidade | v1 (MVP) | v2 | Futuro |
|---|:-:|:-:|:-:|
| Conta e login | ✅ | | |
| Onboarding (língua nativa, nível, temas, horário) | ✅ | | |
| Teste de nível inicial | ✅ | | |
| Palavra do dia + notificação agendada | ✅ | | |
| Ações na notificação ("Já conheço" / "Guardar") | ✅ | | |
| Ficha da palavra (definição, exemplos, áudio, tradução…) | ✅ | | |
| Dicionário: pesquisa online + cache offline | ✅ | | |
| Favoritos e histórico | ✅ | | |
| Revisão espaçada | ✅ | | |
| Mini-testes (escolha múltipla, completar a frase) | ✅ | | |
| Nível adaptativo (sobe/desce automaticamente) | ✅ | | |
| Sequência de dias, contador de palavras, estatísticas | ✅ | | |
| Anúncios: banner que se pode fechar + recompensa opcional | ✅ | | |
| "Remover anúncios" e gorjetas | | ✅ | |
| Widget no ecrã inicial | | ✅ | |
| Teste "ouvir e escrever" | | ✅ | |
| Listas pessoais ("Palavras do trabalho") | | ✅ | |
| Origem da palavra (etimologia) | | ✅ | |
| Modo escuro | ✅ | | |
| Interface em mais línguas | | ✅ | |
| Preparação para exames (IELTS/TOEFL) | | | ✅ |
| Reconhecimento de voz (avaliar a pronúncia) | | | ✅ |

---

## 3. Requisitos funcionais

### 3.1 Onboarding (primeira abertura)
- **FR-01** Ecrã de boas-vindas que explica a proposta em 2 ou 3 cartões.
- **FR-02** Escolher a **língua nativa**, pré-selecionada a partir da língua do telemóvel. Define a língua das traduções.
- **FR-03** Escolher o **nível**, de uma de duas formas:
  - autoavaliação: "Sou iniciante / Consigo conversar / Sou fluente…", convertida para o nível CEFR (A1–C2);
  - **teste rápido de nível** (recomendado): 15–20 palavras de dificuldade crescente, em que a pessoa indica se conhece cada uma, com verificação por escolha múltipla. Dura cerca de 2 minutos.
- **FR-04** Escolher **temas** (vários): Dia a dia, Negócios, Viagens, Tecnologia, Saúde, Estudos/Académico, Emoções e relações, Comida, Desporto, Cultura e entretenimento.
- **FR-05** Escolher **quantas palavras por dia** (1 a 3) e **a que horas** as recebe.
- **FR-06** Pedir a **permissão de notificações** com um ecrã explicativo antes do pedido do sistema, porque um pedido sem contexto é muitas vezes recusado.
- **FR-07** Criar conta ou entrar (ver 3.8). Todas as escolhas podem ser alteradas depois nas Definições.

### 3.2 Palavra do dia
- **FR-10** O servidor escolhe as palavras do dia para cada pessoa:
  - cerca de 80% do **nível atual** e 20% do **nível seguinte**, para puxar a pessoa para cima;
  - de preferência dos **temas escolhidos**;
  - sem palavras já vistas nem marcadas como "Já conheço";
  - se for possível, prioriza palavras frequentes.
- **FR-11** A app descarrega com antecedência as palavras dos **próximos 7 dias** e agenda as notificações localmente. Assim a notificação chega mesmo sem internet no momento.
- **FR-12** A notificação mostra a palavra e uma definição curta. Tem as ações **"Já conheço"** (sai do plano e o nível é ajustado) e **"Guardar"** (vai para os favoritos). Um toque abre a ficha da palavra.
- **FR-13** Se a pessoa não abrir a palavra, ela continua em "Hoje" e entra na revisão à mesma.
- **FR-14** Se houver revisões pendentes, pode haver um **lembrete de revisão** (opcional, à hora escolhida).

### 3.3 Ficha da palavra
- **FR-20** Conteúdo:
  - palavra e **pronúncia fonética (IPA)**;
  - **áudio da pronúncia**: gravação da fonte, ou a voz do telemóvel quando não existe gravação;
  - classe gramatical (nome, verbo…) e formas (plural, passado…);
  - **definição em inglês simples**, uma por sentido, com o sentido principal primeiro;
  - **2 ou 3 frases de exemplo** reais, de preferência ligadas aos temas da pessoa;
  - **tradução** da palavra e dos exemplos para a língua nativa;
  - **sinónimos e antónimos**;
  - **combinações comuns** (ex.: *make a decision*, *meet a deadline*), muito úteis em Negócios;
  - nível CEFR e temas.
- **FR-21** Botões: ouvir, guardar nos favoritos, "Já conheço", partilhar (imagem bonita da palavra, que também divulga a app).

### 3.4 Dicionário
- **FR-30** Pesquisa com sugestões enquanto se escreve.
- **FR-31** **Primeiro procura na cache do telemóvel.** Se a palavra não estiver lá, **procura online**, e o resultado fica guardado na cache.
- **FR-32** Sem internet: pesquisa nas palavras guardadas, que são as palavras vistas, os favoritos, o histórico e um **pacote base do nível** descarregado ao instalar. Se a palavra não estiver disponível offline, a app diz isso claramente.
- **FR-33** Qualquer palavra pesquisada pode ser juntada ao estudo, ou seja, à revisão espaçada.
- **FR-34** Pesquisa ao contrário: escrever na língua nativa para encontrar a palavra inglesa (v1 se o custo o permitir, senão v2).

### 3.5 Favoritos e histórico
- **FR-40** Lista de favoritos com pesquisa e filtros por tema e nível.
- **FR-41** Histórico das palavras do dia e das pesquisas, que se pode limpar.
- **FR-42** Sincronizados com a conta (ver 3.8).

### 3.6 Revisão espaçada e testes
- **FR-50** Cada palavra em estudo tem um estado de memorização. As revisões são calculadas pelo algoritmo **FSRS** (código aberto, usado pelo Anki moderno).
- **FR-51** Sessão de revisão diária curta (5 minutos), com tipos de exercício variados:
  - ver a palavra → lembrar o significado (autoavaliação: "Errei / Difícil / Bom / Fácil");
  - escolha múltipla de definições;
  - completar a frase com a palavra certa;
  - (v2) ouvir e escrever.
- **FR-52** Uma palavra fica **dominada** quando passa várias revisões espaçadas (ex.: intervalo de 21 dias ou mais).

### 3.7 Nível adaptativo
- **FR-60** O nível sobe automaticamente quando, nos últimos 30 dias:
  - a taxa de acerto nas palavras do nível atual é de 85% ou mais, **e**
  - um número mínimo de palavras desse nível já está dominado.
- **FR-61** O nível desce (ou pára de subir) se a taxa de acerto ficar abaixo de 60% por um período prolongado.
- **FR-62** Carregar em "Já conheço" muitas vezes num nível também é sinal de que o nível é baixo demais.
- **FR-63** A mudança de nível é **comunicada** ("Subiste para B2! 🎉") e a pessoa pode ajustar manualmente.

### 3.8 Conta e sincronização
- **FR-70** Login com **e-mail**, **Google** e **Apple**. A Apple obriga a ter "Iniciar sessão com a Apple" quando há login social.
- **FR-71** O progresso (nível, palavras, revisões, favoritos, histórico, definições) é sincronizado entre dispositivos.
- **FR-72** A app funciona offline e sincroniza quando voltar a haver rede.
- **FR-73** A conta pode ser **apagada dentro da app**, e os dados podem ser exportados. As duas lojas obrigam a isto.

### 3.9 Motivação
- **FR-80** Sequência de dias seguidos (*streak*), com um "dia de folga" para não desmotivar.
- **FR-81** Estatísticas: palavras aprendidas e dominadas, evolução do nível, taxa de acerto.
- **FR-82** (v2) **Widget** no ecrã inicial com a palavra do dia.

### 3.10 Monetização: anúncios que não atrapalham
A app é **gratuita e financiada por anúncios** (Google AdMob), porque não há investimento inicial. Regra de ouro: **o anúncio nunca interrompe o que a pessoa está a fazer.**

**Banner**
- **FR-90** Um retângulo fixo (*banner* adaptativo) **no topo** dos ecrãs de navegação (Hoje, Dicionário, Favoritos, Histórico, Estatísticas). Não se mexe com o scroll e não fica por cima do conteúdo.
- **FR-91** Fica **afastado de botões e menus**, com margem, para evitar cliques acidentais (regra do AdMob).
- **FR-92** **Pode ser fechado:** o botão "Ocultar anúncio" **não fica encostado ao banner** (regra do AdMob). Fica numa zona separada, por exemplo no menu do cabeçalho. Quando fechado, o banner não volta até a app ser aberta de novo.
- **FR-93** **Sem banner** no onboarding, nas sessões de revisão e testes, na ficha aberta a partir da notificação e no teste de nível. Nestes momentos a pessoa está concentrada.

**Anúncios com recompensa (opcionais)**
- **FR-94** A pessoa **decide** ver um vídeo curto em troca de uma ajuda. Nunca é obrigatório:
  - **Ajuda no treino:** mostrar a primeira letra, eliminar 2 opções erradas ou ver a frase de exemplo;
  - **Treino extra:** mais uma sessão de treino além da diária;
  - **Recuperar a sequência** de dias perdida;
  - **24 h sem banners.**
- **FR-95** O botão diz sempre claramente "▶ Ver anúncio para…" e mostra o que se ganha.

**O que NÃO se faz**
- **FR-96** Sem anúncios de ecrã inteiro que aparecem sozinhos (*interstitials*), sem anúncios na notificação e sem anúncios com som automático.

**Consentimento e privacidade**
- **FR-97** O formulário de consentimento da Google (UMP) aparece no primeiro uso para utilizadores da Europa e noutros casos exigidos. No iPhone, pede-se a permissão de rastreamento (ATT). Se a pessoa recusar, os anúncios não são personalizados, mas a app funciona na mesma.

**Apoio opcional (v2)**
- **FR-98** Compra única **"Remover anúncios"** e gorjetas, feitas pelo sistema de pagamento da loja. As lojas não permitem links de doação externos, exceto para instituições sem fins lucrativos aprovadas.

---

## 4. Requisitos não funcionais

- **NFR-01 Qualidade profissional:** interface cuidada, animações suaves, acessibilidade (tamanho de letra dinâmico, leitores de ecrã, contraste), modo escuro.
- **NFR-02 Offline primeiro:** palavra do dia, revisões, favoritos e histórico funcionam sem rede.
- **NFR-03 Notificações fiáveis:** agendadas localmente pelo sistema, sem processo em segundo plano. Ter em conta o limite de 64 notificações agendadas no iOS e os fabricantes Android que fecham apps (Xiaomi, Huawei…), com um guia na app para permitir as notificações.
- **NFR-04 Desempenho:** abre em menos de 2 s e a ficha da palavra em cache aparece em menos de 300 ms.
- **NFR-05 Privacidade:** política de privacidade publicada, o mínimo de dados pessoais, RGPD (utilizadores da UE) e a Lei n.º 22/11 de Angola.
- **NFR-06 Interface em várias línguas:** a v1 tem **português e inglês**. As traduções das palavras seguem a língua nativa escolhida, independentemente da língua da interface.
- **NFR-07 Custos controlados:** cada tradução é feita **uma única vez** por par (palavra, língua) e partilhada por todos os utilizadores.

---

## 5. Conteúdo: de onde vêm as palavras

### 5.1 Ajuste à decisão "b) API online"
Mantém-se a ideia de ir buscar os dados online, mas **uma API gratuita sozinha não chega** para uma app profissional:
- a Free Dictionary API **não indica o nível** (A1–C2) **nem os temas**, sem os quais não há personalização;
- **não traduz**;
- tem muitas vezes **poucos ou nenhuns exemplos**;
- não garante disponibilidade. Se cair ou mudar, a app deixa de funcionar.

**Proposta (híbrida):**
1. Um **catálogo próprio** de palavras no servidor. Cada palavra tem **nível CEFR, frequência e temas**, e é isto que permite escolher a palavra do dia.
2. Os dados de cada palavra (definições, IPA, áudio, sinónimos) vêm da **API de dicionário**, **e ficam guardados no nosso servidor** na primeira vez.
3. Os **exemplos** vêm de fontes abertas (ex.: Tatoeba). Se faltarem, podem ser gerados por IA **com revisão**.
4. As **traduções** são feitas por uma API de tradução (Google Translate ou DeepL) e ficam guardadas por língua.
5. A app fala **só com o nosso servidor**, que funciona como uma camada intermédia. Se um fornecedor falhar, troca-se de fornecedor sem atualizar a app.

### 5.2 Fontes escolhidas (ver [PESQUISA.md](PESQUISA.md))
| Dado | Fonte | Licença |
|---|---|---|
| Palavras + nível A1–B2 | CEFR-J Vocabulary Profile v1.5 | Grátis para uso comercial, com citação |
| Palavras C1–C2 | Octanove C1/C2 | CC BY-SA 4.0 |
| Definições, IPA, áudio, sinónimos | Free Dictionary API (Wiktionary) | CC BY-SA, com atribuição |
| Frases de exemplo | Tatoeba (só texto) | CC BY 2.0 FR |
| Tradução | Azure Translator (Google como reserva) | Serviço pago, com uso grátis mensal |
| Temas das palavras | **Classificação própria**, feita uma vez | — |

- **FR-100** Um ecrã **"Créditos e licenças"** na app, com a atribuição exigida por cada fonte.

---

## 6. Arquitetura técnica (proposta)

```
┌───────────────────────────┐        ┌──────────────────────────────────┐
│  App (React Native/Expo)  │  HTTPS │  Backend                         │
│  - TypeScript             │◄──────►│  - Autenticação (e-mail/Google/  │
│  - expo-router            │        │    Apple)                        │
│  - expo-notifications     │        │  - PostgreSQL: catálogo, users,  │
│    (agendamento local)    │        │    progresso, traduções em cache │
│  - SQLite (cache offline) │        │  - Funções: escolher palavras do │
│  - expo-speech (voz)      │        │    dia, enriquecer palavra,      │
│  - ts-fsrs (revisões)     │        │    traduzir, nível adaptativo    │
│  - compras dentro da app  │        └──────────┬───────────────────────┘
└───────────────────────────┘                   │
                                                ▼
                        API de dicionário · API de tradução · Tatoeba
```

- **App:** React Native com **Expo** (um só código para Android e iOS), TypeScript.
- **Backend: Supabase** ✅ (decidido). Plano **Free**: 0 US$ até 50.000 utilizadores ativos por mês. Depois, Pro a 25 US$/mês. Detalhes em [PESQUISA.md](PESQUISA.md).
- **Anúncios:** Google AdMob com `react-native-google-mobile-ads` (requer *development build*, não funciona na Expo Go).
- **Compras dentro da app (v2):** RevenueCat ou `expo-iap`.
- **Custos obrigatórios:** Google Play 25 US$ (uma vez) e Apple 99 US$/ano. **Lançar primeiro no Android.**
- **Widget (v2):** precisa de código nativo (Kotlin/Swift) através de um *config plugin* do Expo.

---

## 7. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| A API de dicionário gratuita falha ou muda | Alto | Guardar tudo no nosso servidor; camada intermédia com fornecedores trocáveis |
| Não haver uma lista CEFR com licença comercial | Alto | Investigar antes de começar (5.2); plano B: estimar o nível pela frequência |
| Exemplos pobres ou em falta | Médio | Tatoeba + IA com revisão |
| Custo das traduções | Médio | Traduzir cada par (palavra, língua) uma única vez |
| Notificações bloqueadas por alguns fabricantes Android | Médio | Guia na app; ecrã "Hoje" como alternativa |
| Rejeição nas lojas (login, apagar conta, anúncios) | Médio | Cumprir as regras desde o início (FR-70, FR-73, FR-90–97) |
| Conta AdMob suspensa por cliques acidentais | Alto | Banner afastado de botões; "Ocultar" separado do anúncio; sem banners nos treinos |
| Receita dos anúncios baixa em alguns países | Médio | Custos de servidor a 0 US$ enquanto possível; anúncios com recompensa rendem mais |
| Ultrapassar os 500 MB da base Supabase | Médio | Guardar só traduções pedidas; vigiar o tamanho; Pro quando houver receita |

---

## 8. Decisões em aberto

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Nome definitivo da app | ✅ **English Daily** (2026-09-25). Com subtítulo nas lojas; verificar marca e domínio antes de publicar |
| D2 | Backend | ✅ **Supabase** (decidido 2026-09-25) |
| D3 | Abordagem híbrida de conteúdo (secção 5.1) | ✅ **Aprovada** (2026-09-25) |
| D4 | Línguas da interface na v1 | ✅ **Português + Inglês** (2026-09-25) |
| D5 | Fornecedor de tradução | ✅ Azure Translator (grátis até 2 M caracteres/mês) + Google como reserva |
| D6 | Monetização | ✅ **Anúncios** (banner que se pode fechar + recompensa opcional); "Remover anúncios" na v2 |
| D7 | Pesquisa ao contrário (língua nativa → inglês) na v1 ou v2 | v2, se for preciso reduzir o âmbito |
| D8 | Lançar primeiro só no Android (poupa os 99 US$/ano da Apple no início) | ✅ **Sim** (2026-09-25). O código continua a ser para Android e iPhone |

---

## 9. Próximos passos

1. ~~Validar este documento~~ ✅ Decisões fechadas, exceto D7 (pesquisa ao contrário na v1 ou v2).
2. ~~Investigação curta~~ ✅ Feita, ver [PESQUISA.md](PESQUISA.md). Falta testar a Free Dictionary API na prática e classificar as palavras por tema.
3. **Protótipo das telas** principais: onboarding, Hoje, ficha da palavra, revisão, dicionário.
4. Dividir em **épicos e histórias** e preparar o repositório (Expo + backend).
5. Desenvolver o MVP por fases: base + login → palavra do dia + notificações → dicionário → revisões + nível adaptativo → doações → publicação em teste fechado.
