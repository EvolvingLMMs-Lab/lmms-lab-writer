-- Fix infinite recursion in RLS policies
-- The issue: documents SELECT checks document_access, which checks documents

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view documents shared with them" ON documents;
DROP POLICY IF EXISTS "Owners can view all access for their documents" ON document_access;
DROP POLICY IF EXISTS "Owners can manage access" ON document_access;
DROP POLICY IF EXISTS "Owners can manage invites" ON share_invites;

-- Create a security definer function to check document access without triggering RLS
CREATE OR REPLACE FUNCTION has_document_access(doc_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM document_access
    WHERE document_id = doc_id AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_document_owner(doc_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM documents
    WHERE id = doc_id AND created_by = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate documents SELECT policies using security definer functions
CREATE POLICY "Users can view owned or shared documents"
  ON documents FOR SELECT
  USING (
    created_by = auth.uid()
    OR has_document_access(id, auth.uid())
  );

-- Recreate document_access policies using security definer functions
CREATE POLICY "Users can view access entries"
  ON document_access FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_document_owner(document_id, auth.uid())
  );

CREATE POLICY "Owners can manage access"
  ON document_access FOR ALL
  USING (is_document_owner(document_id, auth.uid()));

-- Recreate share_invites policies
CREATE POLICY "Owners can manage invites"
  ON share_invites FOR ALL
  USING (is_document_owner(document_id, auth.uid()));
