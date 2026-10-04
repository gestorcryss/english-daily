-- A palavra do dia passa a exigir uma frase de exemplo e, quando a língua da pessoa tem traduções,
-- a tradução da palavra. Palavras muito curtas ("on", "at") ficam de fora.

drop function private.pick_new_word(uuid, text, text[]);

create function private.pick_new_word(p_user uuid, p_level text, p_topics text[], p_lang text)
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
      and length(w.lemma) >= 3
      and exists (select 1 from public.examples e where e.word_id = w.id)
      and (
        not exists (select 1 from public.word_translations any_tr where any_tr.lang = p_lang)
        or exists (select 1 from public.word_translations tr where tr.word_id = w.id and tr.lang = p_lang)
      )
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

revoke all on function private.pick_new_word(uuid, text, text[], text) from public, anon, authenticated;

create or replace function public.get_daily_words(p_from date, p_days integer default 7)
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
  v_candidate text;
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

      -- 1.º do nível e dos temas; 2.º do nível, qualquer tema; 3.º dos níveis mais próximos.
      v_word := private.pick_new_word(v_user, v_level, v_profile.topics, v_profile.native_lang);
      if v_word is null then
        v_word := private.pick_new_word(v_user, v_level, '{}', v_profile.native_lang);
      end if;
      if v_word is null then
        for v_candidate in
          select lvl from unnest(v_levels) with ordinality as l(lvl, idx)
          order by abs(idx - v_level_index), idx
        loop
          v_word := private.pick_new_word(v_user, v_candidate, '{}', v_profile.native_lang);
          exit when v_word is not null;
        end loop;
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

-- Quando a pessoa muda de nível, temas ou língua, as palavras dos dias futuros são escolhidas de novo.
create function public.reset_future_daily_words(p_from date)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.daily_words
  where user_id = (select auth.uid()) and day >= p_from;
$$;

revoke all on function public.reset_future_daily_words(date) from public, anon;
grant execute on function public.reset_future_daily_words(date) to authenticated;
