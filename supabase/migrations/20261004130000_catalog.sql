-- Catálogo de palavras: listas CEFR-J/Octanove (nível) + Wiktionary (ficha) + Tatoeba (exemplos).
-- Leitura pública; escrita apenas pelos scripts de importação (função private.import_catalog_words).

create schema if not exists private;

create table public.topics (
  slug text primary key,
  position smallint not null
);

comment on table public.topics is
  'Temas que a pessoa pode escolher. Os nomes visíveis estão nas traduções da app.';

insert into public.topics (slug, position) values
  ('daily', 1),
  ('business', 2),
  ('travel', 3),
  ('technology', 4),
  ('health', 5),
  ('study', 6),
  ('emotions', 7),
  ('food', 8),
  ('sport', 9),
  ('culture', 10);

create table public.words (
  id bigint generated always as identity primary key,
  lemma text not null,
  pos text not null check (pos in (
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
    'determiner', 'conjunction', 'number', 'interjection', 'other'
  )),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_source text not null check (level_source in ('cefrj', 'octanove')),
  -- Posição numa lista de frequência de uso (1 = mais usada); null se a palavra não constar.
  frequency_rank integer,
  ipa text,
  audio_url text,
  forms jsonb not null default '[]'::jsonb,
  synonyms text[] not null default '{}',
  -- Só palavras com pelo menos um significado entram na palavra do dia.
  has_content boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lemma, pos)
);

create index words_level_idx on public.words (level) where has_content;
create index words_lemma_lower_idx on public.words (lower(lemma) text_pattern_ops);

create table public.senses (
  id bigint generated always as identity primary key,
  word_id bigint not null references public.words (id) on delete cascade,
  position smallint not null,
  gloss text not null,
  tags text[] not null default '{}',
  unique (word_id, position)
);

create table public.examples (
  id bigint generated always as identity primary key,
  word_id bigint not null references public.words (id) on delete cascade,
  sense_id bigint references public.senses (id) on delete cascade,
  position smallint not null,
  text text not null,
  source text not null check (source in ('wiktionary', 'tatoeba', 'generated')),
  -- Identificador na fonte (por exemplo o número da frase no Tatoeba), para atribuição.
  source_ref text
);

create index examples_word_idx on public.examples (word_id);

create table public.word_topics (
  word_id bigint not null references public.words (id) on delete cascade,
  topic_slug text not null references public.topics (slug) on delete cascade,
  source text not null check (source in ('cefrj', 'wiktionary', 'curated')),
  primary key (word_id, topic_slug)
);

create index word_topics_topic_idx on public.word_topics (topic_slug);

create table public.word_translations (
  word_id bigint not null references public.words (id) on delete cascade,
  lang text not null,
  terms text[] not null,
  source text not null check (source in ('wiktionary', 'machine')),
  primary key (word_id, lang)
);

create table public.example_translations (
  example_id bigint not null references public.examples (id) on delete cascade,
  lang text not null,
  text text not null,
  source text not null check (source in ('tatoeba', 'machine')),
  primary key (example_id, lang)
);

-- Leitura pública, sem escrita por clientes.
alter table public.topics enable row level security;
alter table public.words enable row level security;
alter table public.senses enable row level security;
alter table public.examples enable row level security;
alter table public.word_topics enable row level security;
alter table public.word_translations enable row level security;
alter table public.example_translations enable row level security;

create policy "topics: leitura pública" on public.topics for select to anon, authenticated using (true);
create policy "words: leitura pública" on public.words for select to anon, authenticated using (true);
create policy "senses: leitura pública" on public.senses for select to anon, authenticated using (true);
create policy "examples: leitura pública" on public.examples for select to anon, authenticated using (true);
create policy "word_topics: leitura pública" on public.word_topics for select to anon, authenticated using (true);
create policy "word_translations: leitura pública" on public.word_translations for select to anon, authenticated using (true);
create policy "example_translations: leitura pública" on public.example_translations for select to anon, authenticated using (true);

-- Importação em lotes. Recebe um array JSON de palavras no formato de scripts/data/catalog/catalog.jsonl
-- e substitui por completo a ficha de cada uma (significados, exemplos, temas, traduções).
create function private.import_catalog_words(p_words jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  w jsonb;
  s jsonb;
  v_word_id bigint;
  v_sense_id bigint;
  v_sense_position smallint;
  v_example_position smallint;
  v_count integer := 0;
begin
  for w in select * from jsonb_array_elements(p_words) loop
    insert into public.words as t (
      lemma, pos, level, level_source, frequency_rank, ipa, audio_url, forms, synonyms, has_content
    ) values (
      w->>'lemma',
      w->>'pos',
      w->>'level',
      w->>'source',
      (w->>'frequencyRank')::integer,
      w->>'ipa',
      w->>'audioUrl',
      coalesce(w->'forms', '[]'::jsonb),
      coalesce(array(select jsonb_array_elements_text(w->'synonyms')), '{}'),
      jsonb_array_length(coalesce(w->'senses', '[]'::jsonb)) > 0
    )
    on conflict (lemma, pos) do update set
      level = excluded.level,
      level_source = excluded.level_source,
      frequency_rank = excluded.frequency_rank,
      ipa = excluded.ipa,
      audio_url = excluded.audio_url,
      forms = excluded.forms,
      synonyms = excluded.synonyms,
      has_content = excluded.has_content,
      updated_at = now()
    returning t.id into v_word_id;

    delete from public.senses where word_id = v_word_id;
    delete from public.examples where word_id = v_word_id;
    delete from public.word_topics where word_id = v_word_id;
    delete from public.word_translations where word_id = v_word_id and source = 'wiktionary';

    v_sense_position := 0;
    v_example_position := 0;
    for s in select * from jsonb_array_elements(coalesce(w->'senses', '[]'::jsonb)) loop
      v_sense_position := v_sense_position + 1;
      insert into public.senses (word_id, position, gloss, tags)
      values (
        v_word_id,
        v_sense_position,
        s->>'gloss',
        coalesce(array(select jsonb_array_elements_text(s->'tags')), '{}')
      )
      returning id into v_sense_id;

      insert into public.examples (word_id, sense_id, position, text, source)
      select v_word_id, v_sense_id, v_example_position + ordinality, value, 'wiktionary'
      from jsonb_array_elements_text(coalesce(s->'examples', '[]'::jsonb)) with ordinality;

      v_example_position := v_example_position + jsonb_array_length(coalesce(s->'examples', '[]'::jsonb));
    end loop;

    insert into public.word_topics (word_id, topic_slug, source)
    select v_word_id, topic->>'slug', topic->>'source'
    from jsonb_array_elements(coalesce(w->'topics', '[]'::jsonb)) as topic
    on conflict do nothing;

    insert into public.word_translations (word_id, lang, terms, source)
    select v_word_id, key, array(select jsonb_array_elements_text(value)), 'wiktionary'
    from jsonb_each(coalesce(w->'translations', '{}'::jsonb))
    on conflict (word_id, lang) do nothing;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on schema private from anon, authenticated;
revoke all on function private.import_catalog_words(jsonb) from public, anon, authenticated;

update public.app_config set value = '1'::jsonb, updated_at = now() where key = 'catalog_version';
