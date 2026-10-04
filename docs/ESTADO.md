# Estado do projecto

> Actualizado em 2026-10-04. Complementa o [ROADMAP](ROADMAP.md), que descreve o plano original das fases.

## Resumo

A app funciona de ponta a ponta com dados reais: primeira abertura, teste de nível, palavra do dia, página da palavra, dicionário, revisões e definições. Foi verificada no browser (versão web de pré-visualização) contra o projecto Supabase de desenvolvimento. Ainda não foi testada num telemóvel: as notificações, o áudio e a voz só se podem confirmar aí.

| Fase | Estado | Notas |
|---|---|---|
| F0 Fundação | Feita | Expo SDK 57, Supabase ligado, compilações EAS a funcionar |
| F1 Conteúdo | Feita, com 1 ponto adiado | 9.776 palavras carregadas. A tradução automática das faltas (Azure) fica para depois |
| F2 Introdução e conta | Feita, sem login | Conta anónima automática. Login com e-mail ou Google adiado (ver «Pendentes teus») |
| F3 Palavra do dia | Feita, por testar no telemóvel | Notificações agendadas no aparelho para 7 dias |
| F4 Dicionário | Feita | Pesquisa no telemóvel e no servidor, favoritos, histórico |
| F5 Aprender | Feita | Revisão espaçada FSRS, 3 tipos de exercício, nível adaptativo, estatísticas |
| F6 Anúncios e definições | Definições feitas, anúncios por fazer | Os anúncios precisam da conta AdMob |
| F7 Lançamento | Por fazer | Precisa da conta Google Play |

Verificações automáticas: 57 testes, tipos e lint sem erros (`npm run check` em `app/`).

## O que mudou em relação ao plano

1. **Fonte do dicionário.** A Free Dictionary API falhou todos os pedidos no teste (ver [F1.1](F1.1-fontes-de-dicionario.md)). O catálogo vem do Wiktionary (via wiktextract), descarregado e tratado por scripts nossos. A app só fala com o Supabase.
2. **Traduções.** A maior parte vem do próprio Wiktionary, em 43 línguas, sem custo. Em português, 86% das palavras têm tradução (97% em A1, 65% em C2). A API de tradução da Azure deixa de ser precisa para lançar.
3. **Exemplos traduzidos.** As frases do Tatoeba trazem tradução em português para 81% das palavras. Para outras línguas é preciso descarregar os ficheiros dessa língua e correr de novo os passos 2 e 3 do catálogo.
4. **Conta.** O Supabase não deixa personalizar os e-mails de entrada no plano grátis sem um serviço de envio próprio, e o envio incluído está limitado a poucas mensagens por hora. A app cria uma conta anónima na primeira abertura, o que dá sincronização com o servidor sem pedir nada à pessoa. A introdução ficou com 3 passos em vez de 4.
5. **Temas.** As listas CEFR só classificam 22% das palavras. Juntei os temas do Wiktionary e listas escritas à mão (cerca de 800 palavras, com peso em Negócios). Ficam com tema 35% das palavras. A escolha da palavra do dia prefere os temas da pessoa e recorre às restantes quando os temas se esgotam.
6. **Gráfico semanal.** Mostra respostas por dia e não minutos, porque é o que a app mede de facto.
7. **Hora das notificações.** Escolhe-se em passos de 30 minutos, com botões de menos e mais.

## Limitações conhecidas do conteúdo

- A ordem dos significados é a do Wiktionary, que nem sempre começa pelo sentido mais comum. Exemplo: «deliver» aparece primeiro como «libertar». Corrigir isto exige rever as palavras mais usadas, à mão ou com ajuda de um modelo de linguagem.
- Os temas vindos das listas CEFR são largos. «weapon» fica em «Dia a dia» porque a lista o põe em «Notícias e actualidade».
- Em português as traduções misturam variantes de Portugal e do Brasil («prefeito» para «mayor»).
- 153 palavras das listas não têm ficha utilizável e ficam fora da palavra do dia.

## Pendentes teus

| O quê | Para quê | Urgência |
|---|---|---|
| Confirmar o identificador `com.englishdaily.app` | Fica definitivo ao publicar na Google Play | Antes da F7 |
| Trocar a palavra-passe da base de dados | Apareceu no terminal lido durante esta sessão | Recomendado |
| Conta AdMob e os identificadores da app e dos blocos de anúncio | Anúncios (F6) | Bloqueia a F6 |
| Conta Google Play Console (25 US$) e cerca de 12 testadores | Publicação (F7) | Bloqueia a F7 |
| Serviço de envio de e-mail (por exemplo Resend, plano grátis) | Login com e-mail | Opcional na v1 |
| Credenciais OAuth da Google (Google Cloud) | Login com Google | Opcional na v1 |
| Rever a [política de privacidade](POLITICA-DE-PRIVACIDADE.md) e indicar um contacto | Obrigatória nas lojas | Antes da F7 |
| Ícone e ecrã de arranque definitivos | Ainda são os da Expo, com fundo azul | Antes da F7 |

## Como instalar no telemóvel

A compilação de pré-visualização é um APK que funciona sozinho, sem o computador. A lista de compilações está em https://expo.dev/accounts/gestorcrysss-team/projects/englishdaily/builds. Abrir a mais recente com o perfil `preview` no telemóvel Android e instalar o APK.

Para gerar uma nova depois de alterações:

```bash
cd app
npx.cmd eas-cli@latest build --profile preview --platform android
```

## O que testar no telemóvel

1. A notificação da palavra do dia chega à hora escolhida, com a app fechada.
2. Os botões «Já conheço» e «Guardar» da notificação funcionam.
3. Tocar na notificação abre a página da palavra.
4. O botão de ouvir toca a gravação, ou a voz do telemóvel quando não há gravação.
5. Em modo de avião, a app abre, mostra a palavra de hoje e deixa fazer revisões.

## Reconstruir o catálogo

```bash
node scripts/catalog/1-fetch-wiktionary.mjs 8    # repetir até dizer «por fazer: 0»
node scripts/catalog/2-build-catalog.mjs
node scripts/catalog/3-load-supabase.mjs 0 8      # retomar no lote indicado até «catálogo completo»
```

Os ficheiros de origem (listas CEFR, frequência, Tatoeba) ficam em `scripts/data/raw/`, fora do Git. Os endereços estão em [PESQUISA.md](PESQUISA.md) e no cabeçalho de cada script.
