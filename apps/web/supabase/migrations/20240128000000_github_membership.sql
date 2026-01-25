-- GitHub OAuth and Membership System
-- Tracks GitHub tokens and star-based membership

-- Store GitHub OAuth tokens for API calls
create table if not exists user_github_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_id bigint unique not null,
  github_username text not null,
  github_avatar_url text,
  access_token text not null,
  token_scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_github_tokens_github_id on user_github_tokens(github_id);
create index if not exists idx_user_github_tokens_username on user_github_tokens(github_username);

-- Track membership status based on GitHub stars
create table if not exists user_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'supporter')),
  expires_at timestamptz,
  starred_repos jsonb not null default '[]',
  total_star_count int not null default 0,
  last_star_check timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_memberships_tier on user_memberships(tier);
create index if not exists idx_user_memberships_expires on user_memberships(expires_at);

-- Enable RLS
alter table user_github_tokens enable row level security;
alter table user_memberships enable row level security;

-- RLS Policies for user_github_tokens
create policy "Users can view own github tokens"
  on user_github_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own github tokens"
  on user_github_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github tokens"
  on user_github_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own github tokens"
  on user_github_tokens for delete
  using (auth.uid() = user_id);

-- RLS Policies for user_memberships
create policy "Users can view own membership"
  on user_memberships for select
  using (auth.uid() = user_id);

create policy "Users can insert own membership"
  on user_memberships for insert
  with check (auth.uid() = user_id);

create policy "Users can update own membership"
  on user_memberships for update
  using (auth.uid() = user_id);

-- Auto-create membership record when user signs up
create or replace function create_user_membership()
returns trigger as $$
begin
  insert into user_memberships (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_membership on auth.users;
create trigger on_auth_user_created_membership
  after insert on auth.users
  for each row execute procedure create_user_membership();

-- Function to calculate membership tier based on star count
create or replace function calculate_membership_tier(star_count int)
returns text as $$
begin
  if star_count >= 1 then
    return 'supporter';
  else
    return 'free';
  end if;
end;
$$ language plpgsql immutable;

-- Function to calculate membership expiry based on star count
-- Max 5 stars = max 35 days (7 days per star, capped at 35)
create or replace function calculate_membership_expiry(star_count int)
returns timestamptz as $$
declare
  effective_stars int;
  days_granted int;
begin
  if star_count >= 1 then
    effective_stars := least(star_count, 5);
    days_granted := least(effective_stars * 7, 35);
    return now() + (days_granted * interval '1 day');
  else
    return null;
  end if;
end;
$$ language plpgsql stable;

-- Function to update membership based on stars (called from API)
create or replace function update_membership_from_stars(
  p_user_id uuid,
  p_starred_repos jsonb,
  p_star_count int
)
returns void as $$
declare
  v_tier text;
  v_expires_at timestamptz;
begin
  v_tier := calculate_membership_tier(p_star_count);
  v_expires_at := calculate_membership_expiry(p_star_count);
  
  insert into user_memberships (user_id, tier, expires_at, starred_repos, total_star_count, last_star_check, updated_at)
  values (p_user_id, v_tier, v_expires_at, p_starred_repos, p_star_count, now(), now())
  on conflict (user_id) do update set
    tier = v_tier,
    expires_at = greatest(user_memberships.expires_at, v_expires_at),
    starred_repos = p_starred_repos,
    total_star_count = p_star_count,
    last_star_check = now(),
    updated_at = now();
end;
$$ language plpgsql security definer;
