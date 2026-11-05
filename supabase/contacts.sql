-- =============================================================================
-- Join – Tabelle "contacts"
--
-- Einmal komplett im Supabase SQL Editor ausführen:
-- Dashboard → SQL Editor → New query → alles einfügen → Run
--
-- Sollte eine Zeile fehlschlagen, dann wird nichts angelegt.
--
-- Gibt es die Tabelle schon, bricht es mit "already exists" ab und ändert
-- nichts. Zum Neuaufbau vorher einmal drop table public.contacts;  ausführen.
-- Achtung: Das löscht alle Kontakte in der Tabelle.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Tabelle
-- -----------------------------------------------------------------------------
create table public.contacts (
  -- UUID als ID, wird von der Datenbank selbst vergeben
  id         uuid primary key default gen_random_uuid(),

  -- Pflichtfeld: Vor- und Nachname zusammen in einem Feld,
  -- z.B.'Anton Mayer'; nicht leer (kein Leerzeichen), höchstens 100 Zeichen
  name       text not null check (btrim(name) <> '' and char_length(name) <= 100),

  -- Pflichtfeld: genau ein @ mit Text davor und dahinter, keine Leerzeichen
  email      text not null check (email ~ '^[^@\s]+@[^@\s]+$' and char_length(email) <= 254),

  -- Optional: darf fehlen (NULL), höchstens 50 Zeichen
  phone      text check (char_length(phone) <= 50),

  -- Avatar-Farbe als Hex-Wert
  color      text not null default '#29ABE2' check (color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Zeitstempel setzt die Datenbank, nicht das Frontend
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Account, zu dem der Kontakt gehört, leer bei Dummy-Kontakten.
  -- Wird der Account gelöscht, verschwindet sein Kontakt mit.
  user_id    uuid references auth.users (id) on delete cascade,

  -- Jede E-Mail-Adresse gibt es nur einmal
  constraint unique_email unique (email)
);

comment on table public.contacts is 'Kontakte der Join-App';

create index contacts_user_id_idx on public.contacts (user_id);

-- -----------------------------------------------------------------------------
-- 2) updated_at bei jeder Änderung automatisch auf "jetzt" setzen
-- -----------------------------------------------------------------------------
create extension if not exists moddatetime schema extensions;

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row
  execute function extensions.moddatetime(updated_at);

-- -----------------------------------------------------------------------------
-- 3) Freigabe für die API
--    In Supabase ist eine neue Tabelle erst über die API
--    erreichbar, wenn die Rollen ausdrücklich Rechte bekommen.
--    anon          = Anfragen ohne Login (Sprint1)
--    authenticated = eingeloggte Nutzer  (Sprint1)
--    service_role  = serverseitige Zugriffe mit dem Secret Key (Sprint1)
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on public.contacts to anon, authenticated;
grant select, insert, update, delete on public.contacts to service_role;

-- -----------------------------------------------------------------------------
-- 4) Row Level Security (RLS)
--    RLS bleibt eingeschaltet. Ohne Policy darf niemand etwas, deshalb gibt es
--    für jede der vier Aktionen eine eigene Regel.
-- -----------------------------------------------------------------------------
alter table public.contacts enable row level security;

create policy "Logged-in users can read contacts"
  on public.contacts for select
  to authenticated
  using (true);

create policy "Logged-in users can add contacts"
  on public.contacts for insert
  to authenticated
  with check (true);

create policy "Logged-in users can update contacts"
  on public.contacts for update
  to authenticated
  using (true)
  with check (true);

-- Löschen nur beim eigenen Kontakt und bei Dummy-Kontakten (ohne user_id)
create policy "Delete own or dummy contacts"
  on public.contacts for delete
  to authenticated
  using (user_id is null or user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 5) Eigener Kontakt bei der Registrierung
--    Legt für jeden neuen Account einen Kontakt mit dem Namen aus dem
--    Sign up an. Gäste bekommen keinen.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_anonymous is not true and new.email is not null then
    insert into public.contacts (name, email, color, user_id)
    values (
      coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
      lower(new.email),
      '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
      new.id
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6) Eigenen Account löschen
--    Die App ruft das auf, wenn jemand seinen eigenen Kontakt löscht.
--    Der Kontakt verschwindet über user_id mit.
-- -----------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- -----------------------------------------------------------------------------
-- 7) Beispielkontakte (Für leeren Start löschen)
-- -----------------------------------------------------------------------------
insert into public.contacts (name, email, phone, color) values
  ('Anton Mayer',      'anton.mayer@example.com',      '+49 1111 111111', '#FF7A00'),
  ('Anja Schulz',      'anja.schulz@example.com',      '+49 2222 222222', '#9327FF'),
  ('Benedikt Ziegler', 'benedikt.ziegler@example.com', '+49 3333 333333', '#6E52FF'),
  ('David Eisenberg',  'david.eisenberg@example.com',  '+49 4444 444444', '#FC71FF'),
  ('Eva Fischer',      'eva.fischer@example.com',      '+49 5555 555555', '#FFBB2B');

commit;
