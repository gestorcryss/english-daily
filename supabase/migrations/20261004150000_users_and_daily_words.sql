-- Dados de cada utilizador (perfil, palavras em estudo, revisões, palavras do dia)
-- e as funções que a app chama: ficha da palavra e palavras do dia.
-- Regra geral de acesso: cada pessoa só vê e altera as suas próprias linhas.

-- ---------------------------------------------------------------------------
-- Perfil
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  native_lang text not null default 'pt',
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_auto boolean not null default true,
  topics text[] not null default '{}',
  words_per_day smallint not null default 1 check (words_per_day between 1 and 3),
  notify_time time not null default '08:00',
  review_reminder boolean not null default true,
  review_time time not null default '20:00',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: criar o próprio" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: alterar o próprio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Cria o perfil quando a conta é criada (incluindo contas anónimas).
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Palavras do utilizador (estado da revisão espaçada FSRS, favoritos, «já conheço»)
-- ---------------------------------------------------------------------------
create table public.user_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id bigint not null references public.words (id) on delete cascade,
  status text not null default 'learning' check (status in ('learning', 'known')),
  is_favorite boolean not null default false,
  source text not null default 'daily' check (source in ('daily', 'search', 'test')),
  added_at timestamptz not null default now(),
  -- Cartão FSRS (biblioteca ts-fsrs); null enquanto a palavra não entrou na revisão.
  due timestamptz,
  stability real,
  difficulty real,
  elapsed_days integer,
  scheduled_days integer,
  learning_steps integer,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint not null default 0,
  last_review timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

create index user_words_due_idx on public.user_words (user_id, due) where status = 'learning';

alter table public.user_words enable row level security;

create policy "user_words: ler as próprias" on public.user_words
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_words: criar as próprias" on public.user_words
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_words: alterar as próprias" on public.user_words
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_words: apagar as próprias" on public.user_words
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Registo de respostas (para o nível adaptativo e as estatísticas)
-- ---------------------------------------------------------------------------
create table public.review_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id bigint not null references public.words (id) on delete cascade,
  -- Identificador gerado na app: permite reenviar sem duplicar.
  client_id uuid not null,
  rating smallint not null check (rating between 1 and 4),
  correct boolean not null,
  exercise text not null,
  word_level text not null,
  reviewed_at timestamptz not null,
  unique (user_id, client_id)
);

create index review_logs_user_time_idx on public.review_logs (user_id, reviewed_at desc);

alter table public.review_logs enable row level security;

create policy "review_logs: ler os próprios" on public.review_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "review_logs: criar os próprios" on public.review_logs
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Palavras do dia
-- ---------------------------------------------------------------------------
create table public.daily_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  position smallint not null,
  word_id bigint not null references public.words (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, day, position)
);

create index daily_words_user_word_idx on public.daily_words (user_id, word_id);

alter table public.daily_words enable row level security;

create policy "daily_words: ler as próprias" on public.daily_words
  for select to authenticated using (user_id = (select auth.uid()));
create policy "daily_words: criar as próprias" on public.daily_words
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "daily_words: apagar as próprias" on public.daily_words
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Ficha completa de uma palavra, com traduções na língua pedida
-- ---------------------------------------------------------------------------
create function public.word_card(p_word_id bigint, p_lang text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'lemma', w.lemma,
    'pos', w.pos,
    'level', w.level,
    'ipa', w.ipa,
    'audioUrl', w.audio_url,
    'forms', w.forms,
    'synonyms', to_jsonb(w.synonyms),
    'topics', coalesce(
      (select jsonb_agg(wt.topic_slug order by t.position)
       from public.word_topics wt
       join public.topics t on t.slug = wt.topic_slug
       where wt.word_id = w.id),
      '[]'::jsonb),
    'translation', coalesce(
      (select to_jsonb(tr.terms)
       from public.word_translations tr
       where tr.word_id = w.id and tr.lang = p_lang),
      '[]'::jsonb),
    'senses', coalesce(
      (select jsonb_agg(jsonb_build_object('gloss', s.gloss) order by s.position)
       from public.senses s
       where s.word_id = w.id),
      '[]'::jsonb),
    -- Primeiro os exemplos com tradução na língua pedida, depois os restantes.
    'examples', coalesce(
      (select jsonb_agg(jsonb_build_object('text', e.text, 'translation', e.translation, 'source', e.source)
                        order by (e.translation is null), e.position)
       from (
         select ex.text, ex.source, ex.position, et.text as translation
         from public.examples ex
         left join public.example_translations et on et.example_id = ex.id and et.lang = p_lang
         where ex.word_id = w.id
         order by (et.text is null), ex.position
         limit 3
       ) e),
      '[]'::jsonb)
  )
  from public.words w
  where w.id = p_word_id;
$$;

-- ---------------------------------------------------------------------------
-- Escolha de uma palavra nova para o utilizador
-- ---------------------------------------------------------------------------
create function private.pick_new_word(p_user uuid, p_level text, p_topics text[])
returns bigint
language sql
volatile
set search_path = ''
as $$
  -- Entre as 150 palavras mais usadas que a pessoa ainda não viu, escolhe uma ao acaso.
  select id
  from (
    select w.id
    from public.words w
    where w.has_content
      and w.level = p_level
      and w.pos in ('noun', 'verb', 'adjective', 'adverb')
      and (
        cardinality(p_topics) = 0
        or exists (
          select 1 from public.word_topics wt
          where wt.word_id = w.id and wt.topic_slug = any (p_topics)
        )
      )
      and not exists (select 1 from public.user_words uw where uw.user_id = p_user and uw.word_id = w.id)
      and not exists (select 1 from public.daily_words dw where dw.user_id = p_user and dw.word_id = w.id)
    order by w.frequency_rank nulls last
    limit 150
  ) candidates
  order by random()
  limit 1;
$$;

revoke all on function private.pick_new_word(uuid, text, text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Palavras do dia: garante que existem para os dias pedidos e devolve as fichas
-- ---------------------------------------------------------------------------
create function public.get_daily_words(p_from date, p_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_profile public.profiles;
  v_levels constant text[] := array['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  v_level_index integer;
  v_day date;
  v_position integer;
  v_level text;
  v_word bigint;
begin
  if v_user is null then
    raise exception 'sessão necessária';
  end if;
  if p_days < 1 or p_days > 14 then
    raise exception 'p_days tem de estar entre 1 e 14';
  end if;

  select * into v_profile from public.profiles where id = v_user;
  if not found then
    insert into public.profiles (id) values (v_user) returning * into v_profile;
  end if;
  v_level_index := array_position(v_levels, v_profile.level);

  for v_day in select generate_series(p_from, p_from + (p_days - 1), interval '1 day')::date loop
    for v_position in 1..v_profile.words_per_day loop
      continue when exists (
        select 1 from public.daily_words
        where user_id = v_user and day = v_day and position = v_position
      );

      -- Uma em cada cinco palavras vem do nível seguinte, para puxar a pessoa para cima.
      v_level := v_levels[least(v_level_index + (case when random() < 0.2 then 1 else 0 end), 6)];

      -- 1.º do nível e dos temas; 2.º do nível, qualquer tema; 3.º do nível actual; 4.º de níveis vizinhos.
      v_word := private.pick_new_word(v_user, v_level, v_profile.topics);
      if v_word is null then
        v_word := private.pick_new_word(v_user, v_level, '{}');
      end if;
      if v_word is null then
        v_word := private.pick_new_word(v_user, v_profile.level, '{}');
      end if;
      if v_word is null then
        select private.pick_new_word(v_user, lvl, '{}') into v_word
        from unnest(v_levels) with ordinality as l(lvl, idx)
        where private.pick_new_word(v_user, lvl, '{}') is not null
        order by abs(idx - v_level_index)
        limit 1;
      end if;
      continue when v_word is null;

      insert into public.daily_words (user_id, day, position, word_id)
      values (v_user, v_day, v_position, v_word)
      on conflict do nothing;
    end loop;
  end loop;

  return coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'day', dw.day,
         'position', dw.position,
         'word', public.word_card(dw.word_id, v_profile.native_lang)
       ) order by dw.day, dw.position)
     from public.daily_words dw
     where dw.user_id = v_user
       and dw.day >= p_from
       and dw.day < p_from + p_days
       and dw.position <= v_profile.words_per_day),
    '[]'::jsonb);
end;
$$;

revoke all on function public.get_daily_words(date, integer) from public, anon;
grant execute on function public.get_daily_words(date, integer) to authenticated;
grant execute on function public.word_card(bigint, text) to anon, authenticated;
