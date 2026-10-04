-- Funções chamadas pela app: teste de nível, pesquisa, pacote de palavras por nível e apagar a conta.

-- ---------------------------------------------------------------------------
-- Teste de nível: palavras frequentes de cada nível, com a resposta certa e 3 erradas
-- ---------------------------------------------------------------------------
-- Se a língua pedida tiver traduções, a resposta é a tradução; senão é a definição em inglês.
create function public.placement_items(p_lang text, p_per_level integer default 5)
returns jsonb
language sql
volatile
set search_path = ''
as $$
  with mode as (
    select exists (select 1 from public.word_translations where lang = p_lang) as has_lang
  ),
  pool as (
    select
      w.id, w.lemma, w.ipa, w.pos, w.level,
      case when m.has_lang then tr.terms[1] else s.gloss end as answer,
      row_number() over (partition by w.level order by w.frequency_rank nulls last) as frequency_position
    from public.words w
    cross join mode m
    join public.senses s on s.word_id = w.id and s.position = 1
    left join public.word_translations tr on tr.word_id = w.id and tr.lang = p_lang
    where w.has_content
      and w.pos in ('noun', 'verb', 'adjective', 'adverb')
      and w.lemma !~ '\s'
      and (not m.has_lang or tr.word_id is not null)
  ),
  picked as (
    select *
    from (
      select p.*, row_number() over (partition by p.level order by random()) as pick_position
      from pool p
      where p.frequency_position <= 400
    ) ranked
    where pick_position <= greatest(1, least(p_per_level, 10))
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'level', p.level,
      'wordId', p.id,
      'lemma', p.lemma,
      'ipa', p.ipa,
      'answer', p.answer,
      'distractors', (
        select coalesce(jsonb_agg(d.answer), '[]'::jsonb)
        from (
          select o.answer
          from pool o
          where o.level = p.level and o.pos = p.pos and o.id <> p.id and o.answer <> p.answer
          order by random()
          limit 3
        ) d
      )
    ) order by p.level, p.pick_position), '[]'::jsonb)
  from picked p;
$$;

-- ---------------------------------------------------------------------------
-- Pesquisa no dicionário (por início da palavra)
-- ---------------------------------------------------------------------------
create function public.search_words(p_query text, p_lang text, p_limit integer default 20)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(row_to_json(r) order by r.exact desc, r.frequency_rank nulls last, r.lemma), '[]'::jsonb)
  from (
    select
      w.id,
      w.lemma,
      w.pos,
      w.level,
      tr.terms[1] as translation,
      s.gloss,
      w.frequency_rank,
      (lower(w.lemma) = lower(trim(p_query))) as exact
    from public.words w
    join public.senses s on s.word_id = w.id and s.position = 1
    left join public.word_translations tr on tr.word_id = w.id and tr.lang = p_lang
    where w.has_content
      and length(trim(p_query)) >= 1
      and lower(w.lemma) like replace(replace(lower(trim(p_query)), '%', ''), '_', '') || '%'
    order by (lower(w.lemma) = lower(trim(p_query))) desc, w.frequency_rank nulls last, w.lemma
    limit greatest(1, least(p_limit, 50))
  ) r;
$$;

-- ---------------------------------------------------------------------------
-- Pacote de um nível: resumo de todas as palavras, para pesquisa sem rede e para os exercícios
-- ---------------------------------------------------------------------------
create function public.level_pack(p_level text, p_lang text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'lemma', w.lemma,
      'pos', w.pos,
      'level', w.level,
      'translation', tr.terms[1],
      'gloss', s.gloss
    ) order by w.frequency_rank nulls last), '[]'::jsonb)
  from public.words w
  join public.senses s on s.word_id = w.id and s.position = 1
  left join public.word_translations tr on tr.word_id = w.id and tr.lang = p_lang
  where w.has_content and w.level = p_level;
$$;

-- ---------------------------------------------------------------------------
-- Apagar a conta e todos os dados da pessoa (obrigatório nas lojas)
-- ---------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'sessão necessária';
  end if;
  -- As tabelas public.* têm "on delete cascade" para auth.users.
  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.placement_items(text, integer) to anon, authenticated;
grant execute on function public.search_words(text, text, integer) to anon, authenticated;
grant execute on function public.level_pack(text, text) to anon, authenticated;
