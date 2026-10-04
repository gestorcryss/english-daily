-- A importação passa a aceitar frases do Tatoeba com tradução (campo "tatoebaExamples").
create or replace function private.import_catalog_words(p_words jsonb)
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
  x jsonb;
  v_example_id bigint;
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

    -- Frases do Tatoeba, com as traduções que existirem.
    for x in select * from jsonb_array_elements(coalesce(w->'tatoebaExamples', '[]'::jsonb)) loop
      v_example_position := v_example_position + 1;
      insert into public.examples (word_id, sense_id, position, text, source, source_ref)
      values (v_word_id, null, v_example_position, x->>'text', 'tatoeba', x->>'ref')
      returning id into v_example_id;

      insert into public.example_translations (example_id, lang, text, source)
      select v_example_id, key, value, 'tatoeba'
      from jsonb_each_text(coalesce(x->'translations', '{}'::jsonb));
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

revoke all on function private.import_catalog_words(jsonb) from public, anon, authenticated;
