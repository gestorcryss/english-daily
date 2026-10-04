-- Configuração pública da app (valores que a app lê sem sessão iniciada):
-- versão do catálogo de palavras, versão mínima suportada, avisos de manutenção.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is
  'Pares chave/valor públicos lidos pela app. Só leitura para clientes; escrita apenas por migrações ou service role.';

alter table public.app_config enable row level security;

create policy "app_config: leitura pública"
  on public.app_config
  for select
  to anon, authenticated
  using (true);

insert into public.app_config (key, value) values
  ('catalog_version', '0'::jsonb),
  ('min_app_version', '"0.1.0"'::jsonb);
