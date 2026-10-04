# Pesquisa técnica — conteúdo, custos e anúncios

> **Data:** 2026-09-25 · Complementa o [PRD](PRD.md), secção 5.2.
> Os preços e as regras mudam com o tempo. Confirmar nas fontes antes de publicar a app.

---

## 1. Resumo

| Tema | Conclusão |
|---|---|
| Lista de palavras por nível | ✅ **Existe e é gratuita para uso comercial**: CEFR-J (A1–B2) + Octanove (C1/C2) |
| Dicionário (definições, IPA, áudio) | ✅ **Free Dictionary API**: gratuita, sem chave, dados do Wiktionary (CC BY-SA) |
| Frases de exemplo | ✅ **Tatoeba**: texto em CC BY 2.0 FR, uso comercial permitido. ⚠️ O áudio tem licenças variadas, por isso não se usa |
| Tradução | ✅ **Azure Translator**: 2 milhões de caracteres por mês grátis. Google como reserva (500 mil/mês) |
| Servidor (Supabase) | ✅ **Grátis até 50.000 utilizadores ativos por mês**. Depois disso, 25 US$/mês |
| Anúncios | ✅ **AdMob** com `react-native-google-mobile-ads`, que funciona com Expo |
| Custo inevitável | ⚠️ **Lojas: Google 25 US$ (uma vez) e Apple 99 US$/ano** |

**Conclusão: dá para lançar a v1 com custo mensal de 0 US$.** O único custo obrigatório é o registo nas lojas.

---

## 2. Supabase: tem limite e cobra?

Sim. O plano **Free** tem limites e **não cobra nada** enquanto não forem ultrapassados:

| Recurso | Free | Chega para |
|---|---|---|
| Utilizadores ativos por mês | **50.000** | Muito mais do que o previsto no primeiro ano |
| Base de dados | 500 MB | Catálogo de cerca de 15 mil palavras + traduções em cache + progresso de milhares de utilizadores. É o primeiro limite a vigiar |
| Tráfego de saída (egress) | 5 GB + 5 GB em cache | Chega, porque a app guarda os dados no telemóvel |
| Ficheiros | 1 GB | Não guardamos áudio (usamos o link da fonte ou a voz do telemóvel) |
| Funções no servidor | 500.000 chamadas/mês | Chega se a app agrupar pedidos (ex.: 7 dias de palavras num só pedido) |
| Projetos | 2 ativos | Um para desenvolvimento e outro para produção |

⚠️ **Um projeto grátis é pausado ao fim de 1 semana sem atividade.** Com utilizadores reais isso não acontece. Em desenvolvimento pode acontecer: reativa-se no painel.

**Quando crescer:** o plano Pro custa **25 US$/mês** e inclui 100.000 utilizadores ativos (cada utilizador a mais custa 0,00325 US$). Só é preciso quando os anúncios já estiverem a render.

---

## 3. Conteúdo

### 3.1 Nível das palavras: CEFR-J + Octanove
- **CEFR-J Vocabulary Profile v1.5:** palavras com nível **A1–B2** e classe gramatical. **Gratuito para investigação e uso comercial**, desde que se cite a fonte. Direitos da Tono Laboratory (Universidade de Estudos Estrangeiros de Tóquio).
- **Octanove C1/C2 Vocabulary:** completa os níveis **C1 e C2**. Licença **CC BY-SA 4.0**: obriga a dar atribuição e a partilhar os dados derivados com a mesma licença. O código da app não é afetado, só a lista.
- Alternativa com licença MIT: *Words-CEFR-Dataset*, derivado do CEFR-J, que acrescenta frequência de uso (Google N-Gram). É útil para dar prioridade às palavras mais usadas.
- ⚠️ **Estas listas não têm os temas** (Negócios, Dia a dia…). É preciso classificar as palavras por tema **uma única vez** (com um script, com revisão manual das palavras dos temas prioritários) e guardar o resultado no catálogo.

### 3.2 Definições, pronúncia e áudio: Free Dictionary API
- Gratuita, sem chave, sem limite oficial de pedidos. Dados do **Wiktionary** (CC BY-SA), uso comercial permitido **com atribuição**.
- Devolve fonética (IPA), links de áudio (nem sempre), significados por classe gramatical e sinónimos e antónimos. **Os exemplos são raros.**
- ⚠️ Não foi possível testar o serviço durante a pesquisa por uma falha de rede. É preciso testá-lo no início do desenvolvimento.
- **Plano B:** importar os dados do Wiktionary diretamente para a nossa base (ex.: com os ficheiros de *wiktextract*) e deixar de depender da API. A verificar.

### 3.3 Frases de exemplo: Tatoeba
- Frases reais, muitas já traduzidas para várias línguas. **Texto em CC BY 2.0 FR**: uso comercial permitido com atribuição.
- ⚠️ **O áudio tem licenças variadas**, algumas não comerciais. Não se usa. A pronúncia das frases é feita com a voz do telemóvel.
- Se uma palavra não tiver bons exemplos, geram-se com IA, revistos, só para as palavras mais importantes.

### 3.4 Tradução
| Serviço | Grátis por mês | Observações |
|---|---|---|
| **Azure Translator (F0)** | **2.000.000 caracteres** | Grátis de forma permanente. Muitas línguas |
| Google Cloud Translation | 500.000 caracteres | Grátis de forma permanente. Serve de reserva |
| DeepL API Free | 500.000 caracteres | Menos línguas (sem línguas africanas) |

**Estimativa:** uma ficha (palavra + definição curta + 3 exemplos) tem cerca de 300 caracteres. **2 milhões de caracteres dão para cerca de 6.600 fichas novas traduzidas por mês.**

Como cada ficha só se traduz **uma vez por língua**, o gasto é alto no início e depois desce muito. Traduz-se **quando a palavra é pedida pela primeira vez** numa língua, e não o catálogo todo de uma vez. Se a Azure chegar ao limite, passa-se para a Google.

---

## 4. Anúncios

### 4.1 Tecnologia
- **Google AdMob** com a biblioteca `react-native-google-mobile-ads` (Invertase). Suporta banner, anúncios com recompensa e o **formulário de consentimento (UMP)**, obrigatório na Europa.
- ⚠️ Tem código nativo, por isso **não funciona na Expo Go**. É preciso um *development build* (EAS). Isto é normal e não é um problema.
- ⚠️ No iPhone também é preciso pedir a permissão de rastreamento (App Tracking Transparency). Se a pessoa recusar, os anúncios aparecem na mesma, mas não são personalizados.

### 4.2 Regras do AdMob que afetam o desenho
- O banner **não pode estar colado a botões** nem a elementos interativos (menus, botões "seguinte", barras de navegação). Estas colocações são a principal causa de cliques acidentais.
- O banner **não pode ficar entre o conteúdo e a navegação**.
- O banner **não pode mexer-se com o scroll nem ficar a flutuar por cima do conteúdo**: a Google considera isso infração e **pode desativar os anúncios**.
- Um **botão "X" próprio** para fechar é permitido, mas **não pode ficar por cima nem encostado ao anúncio**. Por isso o "fechar" do banner fica **numa zona separada** (ver PRD, 3.10).

---

## 5. Custos: cenário sem investimento

| Item | Custo | Quando |
|---|---|---|
| Supabase Free | 0 US$ | Até 50 mil utilizadores ativos por mês |
| Azure Translator F0 + Google (reserva) | 0 US$ | Até 2,5 M caracteres por mês |
| Free Dictionary API, CEFR-J, Tatoeba | 0 US$ | Com atribuição na app ("Créditos") |
| Expo / EAS (compilação) | 0 US$ no plano grátis | Tem limite de compilações por mês |
| AdMob | 0 US$ (gera receita) | — |
| **Google Play** | **25 US$ (uma vez)** | Para publicar no Android |
| **Apple Developer** | **99 US$/ano** | Para publicar no iPhone |

**Recomendação:** lançar **primeiro no Android** (25 US$). O iPhone entra depois, pago com as receitas dos anúncios, sem mudar o código. As contas pessoais novas na Google Play têm de passar por um **teste fechado com vários testadores (cerca de 12) durante 14 dias** antes de publicar. Confirmar as regras atuais e começar a reunir testadores cedo.

---

## Fontes
- [Supabase — Pricing](https://supabase.com/pricing)
- [Open Language Profiles — CEFR-J / Octanove](https://github.com/openlanguageprofiles/olp-en-cefrj)
- [Words-CEFR-Dataset (MIT)](https://github.com/Maximax67/Words-CEFR-Dataset)
- [Free Dictionary API](https://dictionaryapi.dev/) · [Discussão sobre o Wiktionary como fonte](https://github.com/meetDeveloper/freeDictionaryAPI/discussions/101)
- [Tatoeba — Terms of use](https://tatoeba.org/en/terms_of_use) · [Using the Tatoeba corpus](https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus)
- [Azure Translator — Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/translator/) · [Comparação dos planos grátis 2026](https://chatscontrol.com/blog/translation-api-free-tier-2026-deepl-google-azure)
- [AdMob — Discouraged banner implementations](https://support.google.com/admob/answer/6275345?hl=en) · [Discussão sobre esconder o banner](https://support.google.com/admob/thread/169129495/how-to-hide-show-an-ad-banner-without-violating-policies?hl=en)
- [React Native Google Mobile Ads](https://docs.page/invertase/react-native-google-mobile-ads)
- [Taxas das lojas 2026](https://www.iconikai.com/blog/how-much-does-it-cost-to-publish-an-app-2026) · [Google Play: taxa e regra dos testadores](https://www.iconikai.com/blog/google-play-developer-account-fee-2026)
