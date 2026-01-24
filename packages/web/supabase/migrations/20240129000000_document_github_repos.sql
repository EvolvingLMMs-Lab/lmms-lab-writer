-- Document-GitHub Repository Linking
-- Links documents to GitHub repositories for git versioning

-- Table to track which GitHub repo a document is linked to
create table if not exists document_github_repos (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  owner text not null,
  repo text not null,
  branch text not null default 'main',
  path_prefix text not null default '',
  last_sync_at timestamptz,
  last_commit_sha text,
  sync_direction text not null default 'bidirectional' check (sync_direction in ('push', 'pull', 'bidirectional')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Each document can only be linked to one repo
  unique(document_id)
);

-- Index for looking up by repo
create index idx_document_github_repos_repo on document_github_repos(owner, repo);
create index idx_document_github_repos_document on document_github_repos(document_id);

-- Enable RLS
alter table document_github_repos enable row level security;

-- RLS: Only document owner can view repo links
create policy "Document owners can view repo links"
  on document_github_repos for select
  using (
    document_id in (
      select id from documents where created_by = auth.uid()
    )
  );

-- RLS: Only document owner can link repos
create policy "Document owners can link repos"
  on document_github_repos for insert
  with check (
    document_id in (
      select id from documents where created_by = auth.uid()
    )
  );

-- RLS: Only document owner can update repo links
create policy "Document owners can update repo links"
  on document_github_repos for update
  using (
    document_id in (
      select id from documents where created_by = auth.uid()
    )
  );

-- RLS: Only document owner can unlink repos
create policy "Document owners can unlink repos"
  on document_github_repos for delete
  using (
    document_id in (
      select id from documents where created_by = auth.uid()
    )
  );

-- Trigger to update updated_at
create trigger update_document_github_repos_updated_at
  before update on document_github_repos
  for each row
  execute function update_updated_at_column();

-- Function to check if user has git_versioning feature (pro tier only)
create or replace function user_has_git_versioning()
returns boolean as $$
declare
  v_tier text;
begin
  select tier into v_tier
  from user_memberships
  where user_id = auth.uid();
  
  return v_tier = 'pro';
end;
$$ language plpgsql security definer stable;

-- Additional RLS check for pro-only git versioning
-- This is enforced at the API level, but we add a DB-level check too
create policy "Only pro users can use git versioning"
  on document_github_repos for insert
  with check (user_has_git_versioning());
