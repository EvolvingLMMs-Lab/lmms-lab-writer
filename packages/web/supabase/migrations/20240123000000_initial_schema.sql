-- LaTeX Writer Database Schema
-- Initial migration: Documents, Access Control, Y.js Updates

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Document files (for multi-file LaTeX projects)
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  storage_key TEXT,
  sha256 TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, path)
);

-- Y.js updates for CRDT sync
CREATE TABLE yjs_updates (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL DEFAULT 'main.tex',
  created_at TIMESTAMPTZ DEFAULT now(),
  is_snapshot BOOLEAN DEFAULT false,
  update BYTEA NOT NULL
);

-- Document access control
CREATE TABLE document_access (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, user_id)
);

-- Share invites (pending invitations)
CREATE TABLE share_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('editor', 'viewer')) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_document_files_document_id ON document_files(document_id);
CREATE INDEX idx_yjs_updates_document_id ON yjs_updates(document_id, file_path, id);
CREATE INDEX idx_yjs_updates_snapshots ON yjs_updates(document_id, file_path, is_snapshot) WHERE is_snapshot = true;
CREATE INDEX idx_document_access_user_id ON document_access(user_id);
CREATE INDEX idx_share_invites_token ON share_invites(token);
CREATE INDEX idx_share_invites_email ON share_invites(email);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view documents shared with them"
  ON documents FOR SELECT
  USING (
    id IN (
      SELECT document_id FROM document_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update their documents"
  ON documents FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Editors can update shared documents"
  ON documents FOR UPDATE
  USING (
    id IN (
      SELECT document_id FROM document_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Owners can delete their documents"
  ON documents FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for document_files
CREATE POLICY "Users can view files of accessible documents"
  ON document_files FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
      UNION
      SELECT document_id FROM document_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can modify files"
  ON document_files FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
      UNION
      SELECT document_id FROM document_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- RLS Policies for yjs_updates
CREATE POLICY "Users can view updates of accessible documents"
  ON yjs_updates FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
      UNION
      SELECT document_id FROM document_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can insert updates"
  ON yjs_updates FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
      UNION
      SELECT document_id FROM document_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- RLS Policies for document_access
CREATE POLICY "Users can view their own access"
  ON document_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can view all access for their documents"
  ON document_access FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Owners can manage access"
  ON document_access FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for share_invites
CREATE POLICY "Users can view invites for their email"
  ON share_invites FOR SELECT
  USING (email = auth.email());

CREATE POLICY "Owners can manage invites"
  ON share_invites FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
    )
  );

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE yjs_updates;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_files_updated_at
  BEFORE UPDATE ON document_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to compact Y.js updates (call periodically)
CREATE OR REPLACE FUNCTION compact_yjs_updates(p_document_id UUID, p_file_path TEXT DEFAULT 'main.tex')
RETURNS void AS $$
DECLARE
  v_update_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_update_count
  FROM yjs_updates
  WHERE document_id = p_document_id AND file_path = p_file_path AND NOT is_snapshot;

  IF v_update_count > 200 THEN
    RAISE NOTICE 'Compaction needed for document %, file %: % updates', p_document_id, p_file_path, v_update_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
