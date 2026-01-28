-- Migration: Security & Performance Fixes
-- Generated: 2026-01-28
-- Issues addressed:
--   1. Function Search Path Mutable (10 functions)
--   2. RLS Policy Always True (user_storage INSERT)
--   3. Auth RLS Initialization Plan (performance)

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATH (Security)
-- Add 'SET search_path = ''' to prevent SQL injection via search_path manipulation
-- ============================================================================

-- calculate_membership_expiry
CREATE OR REPLACE FUNCTION public.calculate_membership_expiry(star_count integer)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SET search_path = ''
AS $function$
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
$function$;

-- calculate_membership_tier
CREATE OR REPLACE FUNCTION public.calculate_membership_tier(star_count integer)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = ''
AS $function$
begin
  if star_count >= 1 then
    return 'supporter';
  else
    return 'free';
  end if;
end;
$function$;

-- create_user_membership (trigger - SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_user_membership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  insert into public.user_memberships (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

-- create_user_storage (trigger - SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_user_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_storage (user_id) VALUES (new.id);
  RETURN new;
END;
$function$;

-- get_storage_limit_for_tier
CREATE OR REPLACE FUNCTION public.get_storage_limit_for_tier(tier text)
 RETURNS bigint
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = ''
AS $function$
begin
  case tier
    when 'supporter' then return 104857600; -- 100MB
    else return 52428800;                   -- 50MB (free)
  end case;
end;
$function$;

-- has_document_access (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_document_access(doc_id uuid, uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.document_access
    WHERE document_id = doc_id AND user_id = uid
  );
END;
$function$;

-- is_document_owner (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_document_owner(doc_id uuid, uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.documents
    WHERE id = doc_id AND created_by = uid
  );
END;
$function$;

-- update_membership_from_stars (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_membership_from_stars(p_user_id uuid, p_starred_repos jsonb, p_star_count integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
declare
  v_tier text;
  v_expires_at timestamptz;
begin
  v_tier := public.calculate_membership_tier(p_star_count);
  v_expires_at := public.calculate_membership_expiry(p_star_count);
  
  insert into public.user_memberships (user_id, tier, expires_at, starred_repos, total_star_count, last_star_check, updated_at)
  values (p_user_id, v_tier, v_expires_at, p_starred_repos, p_star_count, now(), now())
  on conflict (user_id) do update set
    tier = v_tier,
    expires_at = greatest(public.user_memberships.expires_at, v_expires_at),
    starred_repos = p_starred_repos,
    total_star_count = p_star_count,
    last_star_check = now(),
    updated_at = now();
end;
$function$;

-- update_updated_at_column (trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- user_has_git_versioning (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.user_has_git_versioning()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
declare
  v_tier text;
begin
  select tier into v_tier
  from public.user_memberships
  where user_id = auth.uid();
  
  return v_tier = 'pro';
end;
$function$;

-- ============================================================================
-- 2. FIX RLS POLICY ALWAYS TRUE (Security)
-- user_storage INSERT policy uses WITH CHECK (true) which is too permissive
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert user storage" ON public.user_storage;

-- Create a proper policy: only allow insert for the authenticated user's own record
-- OR via trigger (which runs as SECURITY DEFINER)
CREATE POLICY "Users can insert own storage"
  ON public.user_storage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. PERFORMANCE: Optimize RLS policies that call auth.uid() repeatedly
-- Use (SELECT auth.uid()) to cache the value once per query
-- ============================================================================

-- documents table policies
DROP POLICY IF EXISTS "Users can view owned or shared documents" ON public.documents;
CREATE POLICY "Users can view owned or shared documents"
  ON public.documents FOR SELECT
  USING (
    created_by = (SELECT auth.uid())
    OR has_document_access(id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
CREATE POLICY "Users can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Owners can update their documents" ON public.documents;
CREATE POLICY "Owners can update their documents"
  ON public.documents FOR UPDATE
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their documents" ON public.documents;
CREATE POLICY "Owners can delete their documents"
  ON public.documents FOR DELETE
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Editors can update shared documents" ON public.documents;
CREATE POLICY "Editors can update shared documents"
  ON public.documents FOR UPDATE
  USING (
    id IN (
      SELECT document_id FROM public.document_access
      WHERE user_id = (SELECT auth.uid())
      AND role = ANY (ARRAY['owner', 'editor'])
    )
  );

-- document_access table policies
DROP POLICY IF EXISTS "Owners can manage access" ON public.document_access;
CREATE POLICY "Owners can manage access"
  ON public.document_access FOR ALL
  USING (is_document_owner(document_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view access entries" ON public.document_access;
CREATE POLICY "Users can view access entries"
  ON public.document_access FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR is_document_owner(document_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view their own access" ON public.document_access;
-- This policy is redundant with "Users can view access entries", skipping recreation

-- document_files table policies
DROP POLICY IF EXISTS "Users can view files of accessible documents" ON public.document_files;
CREATE POLICY "Users can view files of accessible documents"
  ON public.document_files FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
      UNION
      SELECT document_id FROM public.document_access WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can modify files" ON public.document_files;
CREATE POLICY "Editors can modify files"
  ON public.document_files FOR ALL
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
      UNION
      SELECT document_id FROM public.document_access
      WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['owner', 'editor'])
    )
  );

-- document_shared_files table policies
DROP POLICY IF EXISTS "Users can view shared files for accessible documents" ON public.document_shared_files;
CREATE POLICY "Users can view shared files for accessible documents"
  ON public.document_shared_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_shared_files.document_id AND d.created_by = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.document_access da
      WHERE da.document_id = document_shared_files.document_id AND da.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can insert shared files" ON public.document_shared_files;
CREATE POLICY "Document owners can insert shared files"
  ON public.document_shared_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_shared_files.document_id AND d.created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can delete shared files" ON public.document_shared_files;
CREATE POLICY "Document owners can delete shared files"
  ON public.document_shared_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_shared_files.document_id AND d.created_by = (SELECT auth.uid())
    )
  );

-- yjs_updates table policies
DROP POLICY IF EXISTS "Users can view updates of accessible documents" ON public.yjs_updates;
CREATE POLICY "Users can view updates of accessible documents"
  ON public.yjs_updates FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
      UNION
      SELECT document_id FROM public.document_access WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Editors can insert updates" ON public.yjs_updates;
CREATE POLICY "Editors can insert updates"
  ON public.yjs_updates FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
      UNION
      SELECT document_id FROM public.document_access
      WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['owner', 'editor'])
    )
  );

-- share_invites table policies
DROP POLICY IF EXISTS "Owners can manage invites" ON public.share_invites;
CREATE POLICY "Owners can manage invites"
  ON public.share_invites FOR ALL
  USING (is_document_owner(document_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view invites for their email" ON public.share_invites;
CREATE POLICY "Users can view invites for their email"
  ON public.share_invites FOR SELECT
  USING (email = (SELECT auth.email()));

-- user_github_tokens table policies
DROP POLICY IF EXISTS "Users can view own github tokens" ON public.user_github_tokens;
CREATE POLICY "Users can view own github tokens"
  ON public.user_github_tokens FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own github tokens" ON public.user_github_tokens;
CREATE POLICY "Users can insert own github tokens"
  ON public.user_github_tokens FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own github tokens" ON public.user_github_tokens;
CREATE POLICY "Users can update own github tokens"
  ON public.user_github_tokens FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own github tokens" ON public.user_github_tokens;
CREATE POLICY "Users can delete own github tokens"
  ON public.user_github_tokens FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- user_memberships table policies
DROP POLICY IF EXISTS "Users can view own membership" ON public.user_memberships;
CREATE POLICY "Users can view own membership"
  ON public.user_memberships FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own membership" ON public.user_memberships;
CREATE POLICY "Users can insert own membership"
  ON public.user_memberships FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.user_memberships;
CREATE POLICY "Users can update own membership"
  ON public.user_memberships FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- user_storage table policies
DROP POLICY IF EXISTS "Users can view own storage" ON public.user_storage;
CREATE POLICY "Users can view own storage"
  ON public.user_storage FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own storage" ON public.user_storage;
CREATE POLICY "Users can update own storage"
  ON public.user_storage FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- document_github_repos table policies
DROP POLICY IF EXISTS "Document owners can view repo links" ON public.document_github_repos;
CREATE POLICY "Document owners can view repo links"
  ON public.document_github_repos FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can link repos" ON public.document_github_repos;
CREATE POLICY "Document owners can link repos"
  ON public.document_github_repos FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can update repo links" ON public.document_github_repos;
CREATE POLICY "Document owners can update repo links"
  ON public.document_github_repos FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can unlink repos" ON public.document_github_repos;
CREATE POLICY "Document owners can unlink repos"
  ON public.document_github_repos FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Only pro users can use git versioning" ON public.document_github_repos;
CREATE POLICY "Only pro users can use git versioning"
  ON public.document_github_repos FOR INSERT
  WITH CHECK (user_has_git_versioning());
