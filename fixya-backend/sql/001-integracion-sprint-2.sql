BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS specialty VARCHAR;

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating SMALLINT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    service_request_id UUID UNIQUE
        REFERENCES service_requests(id) ON DELETE CASCADE,
    client_id UUID
        REFERENCES users(id) ON DELETE CASCADE,
    technician_id UUID
        REFERENCES technician_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    service_request_id UUID
        REFERENCES service_requests(id) ON DELETE SET NULL
);

COMMIT;
