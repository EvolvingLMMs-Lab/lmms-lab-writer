-- Change yjs_updates.update column from BYTEA to TEXT
-- This allows storing base64-encoded Y.js updates directly without double-encoding issues

-- First, clear existing data (it's corrupt from the bytea/base64 mismatch anyway)
TRUNCATE yjs_updates;

-- Change the column type
ALTER TABLE yjs_updates ALTER COLUMN update TYPE TEXT;
