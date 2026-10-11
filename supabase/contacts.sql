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
  updated_at timestamptz not null default now()
);

comment on table public.contacts is 'Kontakte der Join-App';

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
--
--    Sprint1 hat noch keinen Login, darum gelten die Regeln für alle (true).
--    Sobald es einen Login gibt: in allen vier Policies "anon, authenticated"
--    durch "authenticated" ersetzen, dann kommen nur noch Eingeloggte an die
--    Daten.
-- -----------------------------------------------------------------------------
alter table public.contacts enable row level security;

create policy "Anyone can read contacts"
  on public.contacts for select
  to anon, authenticated
  using (true);

create policy "Anyone can add contacts"
  on public.contacts for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can update contacts"
  on public.contacts for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can delete contacts"
  on public.contacts for delete
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 5) Beispielkontakte (Für leeren Start löschen)
-- -----------------------------------------------------------------------------
insert into public.contacts (name, email, phone, color) values
  ('Anton Mayer',      'anton.mayer@example.com',      '+49 1111 111111', '#FF7A00'),
  ('Anja Schulz',      'anja.schulz@example.com',      '+49 2222 222222', '#9327FF'),
  ('Benedikt Ziegler', 'benedikt.ziegler@example.com', '+49 3333 333333', '#6E52FF'),
  ('David Eisenberg',  'david.eisenberg@example.com',  '+49 4444 444444', '#FC71FF'),
  ('Eva Fischer',      'eva.fischer@example.com',      '+49 5555 555555', '#FFBB2B');

commit;
