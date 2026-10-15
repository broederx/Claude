-- Klantportaal mim | interiors: tabellen en beveiligingsregels (Row Level Security).
--
-- Rollen worden afgeleid van het e-mailadres waarmee iemand inlogt:
--   studio      e-mailadres staat in studio_members
--   uitvoerder  e-mailadres staat bij een uitvoerder in contractors
--   klant       e-mailadres staat als client_email bij een project
-- Wie nergens voorkomt, kan wel inloggen maar ziet niets.

-- ---------------------------------------------------------------- tabellen

create table public.studio_members (
  email text primary key check (email = lower(email))
);

create table public.projects (
  id text primary key,
  name text not null,
  client_name text not null,
  client_email text not null check (client_email = lower(client_email)),
  address text not null default '',
  phase text not null default 'kennismaking'
    check (phase in ('kennismaking', 'pve', 'schetsontwerp', 'definitief', 'uitvoering', 'oplevering')),
  budget numeric(12, 2) not null default 0,
  start_date date not null default current_date,
  delivery_date date not null,
  cover_colors text[] not null default '{}',
  rooms text[] not null default '{}'
);

create table public.contractors (
  id text primary key,
  name text not null,
  trade text not null default '',
  contact_name text not null default '',
  email text not null check (email = lower(email)),
  phone text not null default '',
  project_ids text[] not null default '{}'
);

create table public.mood_items (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  title text not null,
  room text not null,
  kind text not null check (kind in ('kleur', 'materiaal', 'inspiratie')),
  colors text[] not null default '{}',
  image_url text,
  note text,
  added_by text not null check (added_by in ('architect', 'client')),
  reaction text check (reaction in ('love', 'maybe', 'no')),
  comments jsonb not null default '[]'
);

create table public.briefings (
  project_id text primary key references public.projects on delete cascade,
  answers jsonb not null default '{}',
  updated_at timestamp
);

create table public.documents (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  title text not null,
  category text not null check (category in ('tekening', '3d', 'contract', 'advies', 'overig')),
  version integer not null default 1,
  file_name text not null,
  size_kb integer not null default 0,
  uploaded_at timestamp not null default now(),
  status text not null check (status in ('info', 'ter-goedkeuring', 'goedgekeurd', 'wijziging-gevraagd')),
  feedback text,
  final boolean not null default false,
  storage_path text
);

create table public.products (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  room text not null,
  name text not null,
  price numeric(12, 2) not null default 0,
  qty integer not null default 1,
  lead_time_weeks integer not null default 0,
  status text not null check (status in ('voorstel', 'goedgekeurd', 'afgewezen', 'besteld', 'geleverd')),
  color text not null default '#c8b9a4',
  link text,
  client_note text
);

create table public.milestones (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  title text not null,
  date date not null,
  type text not null check (type in ('mijlpaal', 'afspraak', 'levering')),
  location text,
  done boolean not null default false
);

create table public.messages (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  author text not null check (author in ('architect', 'client')),
  text text not null,
  at timestamp not null default now()
);

create table public.invoices (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  kind text not null check (kind in ('offerte', 'factuur')),
  number text not null unique,
  date date not null,
  due_date date not null,
  status text not null check (status in ('concept', 'verzonden', 'geaccepteerd', 'betaald', 'vervallen')),
  vat_rate numeric(5, 2) not null default 21,
  lines jsonb not null default '[]'
);

create table public.choices (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  room text not null,
  question text not null,
  deadline date not null,
  options jsonb not null default '[]',
  chosen_option_id text,
  decided_at timestamp
);

-- Besluitlogboek: alleen toevoegen, nooit wijzigen of verwijderen.
create table public.decisions (
  id text primary key,
  project_id text not null references public.projects on delete cascade,
  at timestamp not null default now(),
  by text not null check (by in ('architect', 'client')),
  subject text not null,
  detail text not null,
  consequence text
);

create table public.read_markers (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  project_id text not null references public.projects on delete cascade,
  at timestamp not null,
  primary key (user_id, project_id)
);

create index on public.mood_items (project_id);
create index on public.documents (project_id);
create index on public.products (project_id);
create index on public.milestones (project_id);
create index on public.messages (project_id);
create index on public.invoices (project_id);
create index on public.choices (project_id);
create index on public.decisions (project_id);
create index on public.contractors (email);
create index on public.projects (client_email);

-- ---------------------------------------------------------------- hulpfuncties

create function public.auth_email() returns text
language sql stable
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create function public.is_studio() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from studio_members where email = auth_email()) $$;

create function public.is_client_of(pid text) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from projects where id = pid and client_email = auth_email()) $$;

create function public.is_contractor_of(pid text) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from contractors where email = auth_email() and pid = any (project_ids)) $$;

-- Welke rol heeft de ingelogde gebruiker? Studio gaat voor uitvoerder, uitvoerder voor klant.
create function public.my_role() returns jsonb
language sql stable security definer set search_path = public
as $$
  select case
    when is_studio() then jsonb_build_object('role', 'architect')
    when exists (select 1 from contractors where email = auth_email())
      then jsonb_build_object('role', 'contractor', 'contractorId', (select id from contractors where email = auth_email() limit 1))
    when exists (select 1 from projects where client_email = auth_email()) then jsonb_build_object('role', 'client')
    else null
  end
$$;

-- Uitvoerders zien van hun projecten alleen naam en adres, niet het budget of de klant.
create function public.contractor_projects()
returns table (id text, name text, address text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.name, p.address
  from projects p
  join contractors c on p.id = any (c.project_ids)
  where c.email = auth_email()
$$;

-- Niet-studiogebruikers mogen bij een update alleen de genoemde kolommen wijzigen.
create function public.guard_columns() returns trigger
language plpgsql
as $$
begin
  if public.is_studio() then
    return new;
  end if;
  if (to_jsonb(new) - tg_argv) is distinct from (to_jsonb(old) - tg_argv) then
    raise exception 'Je mag dit onderdeel niet wijzigen' using errcode = '42501';
  end if;
  return new;
end
$$;

-- Een klant kiest één keer; daarna ligt de keuze vast.
create function public.guard_choice() returns trigger
language plpgsql
as $$
begin
  if not public.is_studio() and old.chosen_option_id is not null then
    raise exception 'Deze keuze is al gemaakt' using errcode = '42501';
  end if;
  return new;
end
$$;

-- Een klant kan een verzonden offerte accepteren, maar zelf geen factuur als betaald markeren.
create function public.guard_invoice() returns trigger
language plpgsql
as $$
begin
  if public.is_studio() or new.status = old.status then
    return new;
  end if;
  if old.kind = 'offerte' and old.status = 'verzonden' and new.status = 'geaccepteerd' then
    return new;
  end if;
  raise exception 'Deze statuswijziging is niet toegestaan' using errcode = '42501';
end
$$;

-- Een klant beoordeelt alleen wat op zijn reactie wacht.
create function public.guard_review() returns trigger
language plpgsql
as $$
declare
  waiting text := tg_argv[0];
begin
  if public.is_studio() or new.status = old.status then
    return new;
  end if;
  if old.status = waiting and new.status = any (tg_argv[1:]) then
    return new;
  end if;
  raise exception 'Deze statuswijziging is niet toegestaan' using errcode = '42501';
end
$$;

create trigger guard_mood before update on public.mood_items
  for each row execute function public.guard_columns('reaction', 'comments');
create trigger guard_documents before update on public.documents
  for each row execute function public.guard_columns('status', 'feedback');
create trigger guard_products before update on public.products
  for each row execute function public.guard_columns('status', 'client_note');
create trigger guard_documents_status before update on public.documents
  for each row execute function public.guard_review('ter-goedkeuring', 'goedgekeurd', 'wijziging-gevraagd');
create trigger guard_products_status before update on public.products
  for each row execute function public.guard_review('voorstel', 'goedgekeurd', 'afgewezen');
create trigger guard_choices_columns before update on public.choices
  for each row execute function public.guard_columns('chosen_option_id', 'decided_at');
create trigger guard_choices_once before update on public.choices
  for each row execute function public.guard_choice();
create trigger guard_invoices_columns before update on public.invoices
  for each row execute function public.guard_columns('status');
create trigger guard_invoices_status before update on public.invoices
  for each row execute function public.guard_invoice();

-- ---------------------------------------------------------------- row level security

alter table public.studio_members enable row level security;
alter table public.projects enable row level security;
alter table public.contractors enable row level security;
alter table public.mood_items enable row level security;
alter table public.briefings enable row level security;
alter table public.documents enable row level security;
alter table public.products enable row level security;
alter table public.milestones enable row level security;
alter table public.messages enable row level security;
alter table public.invoices enable row level security;
alter table public.choices enable row level security;
alter table public.decisions enable row level security;
alter table public.read_markers enable row level security;

-- studio_members en projecten
create policy "studio beheert studioleden" on public.studio_members
  for all to authenticated using (is_studio()) with check (is_studio());

create policy "studio en klant zien project" on public.projects
  for select to authenticated using (is_studio() or client_email = auth_email());
create policy "studio beheert projecten" on public.projects
  for all to authenticated using (is_studio()) with check (is_studio());

-- uitvoerders
create policy "studio en uitvoerder zelf zien uitvoerder" on public.contractors
  for select to authenticated using (is_studio() or email = auth_email());
create policy "studio beheert uitvoerders" on public.contractors
  for all to authenticated using (is_studio()) with check (is_studio());

-- moodboard: klant mag reageren en eigen inspiratie toevoegen of verwijderen
create policy "moodboard lezen" on public.mood_items
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "moodboard toevoegen" on public.mood_items
  for insert to authenticated
  with check (is_studio() or (is_client_of(project_id) and added_by = 'client'));
create policy "moodboard reageren" on public.mood_items
  for update to authenticated
  using (is_studio() or is_client_of(project_id)) with check (is_studio() or is_client_of(project_id));
create policy "moodboard verwijderen" on public.mood_items
  for delete to authenticated using (is_studio() or (is_client_of(project_id) and added_by = 'client'));

-- wensen: de klant vult in, de studio leest mee
create policy "wensen lezen en invullen" on public.briefings
  for all to authenticated
  using (is_studio() or is_client_of(project_id)) with check (is_studio() or is_client_of(project_id));

-- documenten: uitvoerders zien alleen wat de studio definitief heeft gemaakt
create policy "documenten lezen" on public.documents
  for select to authenticated
  using (is_studio() or is_client_of(project_id) or (final and is_contractor_of(project_id)));
create policy "documenten beheren" on public.documents
  for insert to authenticated with check (is_studio());
create policy "documenten akkoord geven" on public.documents
  for update to authenticated
  using (is_studio() or is_client_of(project_id)) with check (is_studio() or is_client_of(project_id));
create policy "documenten verwijderen" on public.documents
  for delete to authenticated using (is_studio());

-- producten
create policy "producten lezen" on public.products
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "producten voorstellen" on public.products
  for insert to authenticated with check (is_studio());
create policy "producten beoordelen" on public.products
  for update to authenticated
  using (is_studio() or is_client_of(project_id)) with check (is_studio() or is_client_of(project_id));
create policy "producten verwijderen" on public.products
  for delete to authenticated using (is_studio());

-- planning
create policy "planning lezen" on public.milestones
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "planning beheren" on public.milestones
  for all to authenticated using (is_studio()) with check (is_studio());

-- berichten: alleen toevoegen, onder je eigen rol
create policy "berichten lezen" on public.messages
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "berichten sturen" on public.messages
  for insert to authenticated
  with check ((is_studio() and author = 'architect') or (is_client_of(project_id) and author = 'client'));

-- offertes en facturen: concepten zijn alleen voor de studio
create policy "facturen lezen" on public.invoices
  for select to authenticated using (is_studio() or (is_client_of(project_id) and status <> 'concept'));
create policy "facturen maken" on public.invoices
  for insert to authenticated with check (is_studio());
create policy "offerte accepteren" on public.invoices
  for update to authenticated
  using (is_studio() or (is_client_of(project_id) and status <> 'concept'))
  with check (is_studio() or is_client_of(project_id));
create policy "facturen verwijderen" on public.invoices
  for delete to authenticated using (is_studio() and status = 'concept');

-- keuzes
create policy "keuzes lezen" on public.choices
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "keuzes voorleggen" on public.choices
  for insert to authenticated with check (is_studio());
create policy "keuze maken" on public.choices
  for update to authenticated
  using (is_studio() or is_client_of(project_id)) with check (is_studio() or is_client_of(project_id));
create policy "keuzes verwijderen" on public.choices
  for delete to authenticated using (is_studio());

-- besluitlogboek
create policy "besluiten lezen" on public.decisions
  for select to authenticated using (is_studio() or is_client_of(project_id));
create policy "besluiten vastleggen" on public.decisions
  for insert to authenticated
  with check ((is_studio() and by = 'architect') or (is_client_of(project_id) and by = 'client'));

-- gelezen-markeringen: ieder alleen de eigen
create policy "eigen gelezen-markeringen" on public.read_markers
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Niemand zonder inlog heeft toegang.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon;

-- ---------------------------------------------------------------- bestanden

insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Pad van een bestand: <project-id>/<document-id>/<bestandsnaam>
create policy "documentbestanden lezen" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents' and (
      public.is_studio()
      or exists (
        select 1 from public.documents d
        where d.storage_path = storage.objects.name
          and (public.is_client_of(d.project_id) or (d.final and public.is_contractor_of(d.project_id)))
      )
    )
  );
create policy "documentbestanden uploaden" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and public.is_studio());
create policy "documentbestanden vervangen" on storage.objects
  for update to authenticated using (bucket_id = 'documents' and public.is_studio());
create policy "documentbestanden verwijderen" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and public.is_studio());

-- ---------------------------------------------------------------- live bijwerken

alter publication supabase_realtime add table
  public.projects, public.contractors, public.mood_items, public.briefings, public.documents,
  public.products, public.milestones, public.messages, public.invoices, public.choices, public.decisions;
