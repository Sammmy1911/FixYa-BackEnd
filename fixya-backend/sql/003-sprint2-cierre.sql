BEGIN;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS warranty_of_id UUID;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS paid_amount INTEGER;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_requests_warranty_of ON service_requests(warranty_of_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_service_requests_warranty_origin' AND conrelid = 'service_requests'::regclass) THEN
    ALTER TABLE service_requests ADD CONSTRAINT fk_service_requests_warranty_origin FOREIGN KEY (warranty_of_id) REFERENCES service_requests(id) ON DELETE SET NULL;
  END IF;
END $$;
UPDATE service_requests SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS ix_notifications_recipient ON notifications(recipient_id, created_at DESC);
COMMIT;
