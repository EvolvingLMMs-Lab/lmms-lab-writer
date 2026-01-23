-- User storage tracking for sharing features
-- Each user gets 50MB free storage

create table if not exists user_storage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_bytes bigint not null default 0,
  max_bytes bigint not null default 52428800, -- 50MB in bytes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_storage enable row level security;

create policy "Users can view own storage"
  on user_storage for select
  using (auth.uid() = user_id);

create policy "Users can update own storage"
  on user_storage for update
  using (auth.uid() = user_id);

create or replace function create_user_storage()
returns trigger as $$
begin
  insert into user_storage (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_user_storage();

-- Document shared files (for sharing compiled PDFs or project snapshots)
create table if not exists document_shared_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  created_at timestamptz not null default now()
);

alter table document_shared_files enable row level security;

create policy "Users can view shared files for accessible documents"
  on document_shared_files for select
  using (
    exists (
      select 1 from documents d
      where d.id = document_shared_files.document_id
      and d.created_by = auth.uid()
    )
    or exists (
      select 1 from document_access da
      where da.document_id = document_shared_files.document_id
      and da.user_id = auth.uid()
    )
  );

create policy "Document owners can insert shared files"
  on document_shared_files for insert
  with check (
    exists (
      select 1 from documents d
      where d.id = document_shared_files.document_id
      and d.created_by = auth.uid()
    )
  );

create policy "Document owners can delete shared files"
  on document_shared_files for delete
  using (
    exists (
      select 1 from documents d
      where d.id = document_shared_files.document_id
      and d.created_by = auth.uid()
    )
  );

create index idx_document_shared_files_document_id on document_shared_files(document_id);
create index idx_document_shared_files_uploaded_by on document_shared_files(uploaded_by);
