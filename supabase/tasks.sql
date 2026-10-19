begin;

create table public.tasks (
    id          uuid primary key default gen_random_uuid(),
    title       text not null check (btrim(title) <> '' and char_length(title) <= 100),
    description text check (char_length(description) <= 1000),
    due_date    date,
    category    text not null check (category in ('user_story', 'technical_task')),
    priority    text not null default 'medium' check (priority in ('urgent', 'medium', 'low')),
    status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'await_feedback', 'done')),
    position    int  not null default 0,   -- Reihenfolge innerhalb der Spalte
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Zuweisung Task <-> Kontakt (n:m). Löscht man einen Kontakt, verschwindet
-- nur die Zuweisung, der Task bleibt.
create table public.task_assignees (
    task_id    uuid not null references public.tasks(id) on delete cascade,
    contact_id uuid not null references public.contacts(id) on delete cascade,
    primary key (task_id, contact_id)
);

create table public.subtasks (
    id      uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    title   text not null check (btrim(title) <> '' and char_length(title) <= 100),
    done    boolean not null default false
);

create index on public.tasks (status, position);
create index on public.task_assignees (contact_id);
create index on public.subtasks (task_id);

create trigger tasks_set_updated_at
    before update on public.tasks
    for each row
    execute function extensions.moddatetime(updated_at);

-- Rechte und RLS wie bei contacts (Sprint 1: ohne Login für alle)
grant select, insert, update, delete
    on public.tasks, public.task_assignees, public.subtasks
    to anon, authenticated, service_role;

do $$
declare t text;
begin
    foreach t in array array['tasks', 'task_assignees', 'subtasks'] loop
        execute format('alter table public.%I enable row level security', t);
        execute format('create policy "Anyone can read %1$s"   on public.%1$I for select to anon, authenticated using (true)', t);
        execute format('create policy "Anyone can add %1$s"    on public.%1$I for insert to anon, authenticated with check (true)', t);
        execute format('create policy "Anyone can update %1$s" on public.%1$I for update to anon, authenticated using (true) with check (true)', t);
        execute format('create policy "Anyone can delete %1$s" on public.%1$I for delete to anon, authenticated using (true)', t);
    end loop;
end $$;

commit;