BEGIN;
ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS auto_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coverage_zones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage_categories integer[] NOT NULL DEFAULT '{}';
COMMIT;
