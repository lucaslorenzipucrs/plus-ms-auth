CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VENDEDOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (
    email,
    password_hash,
    role
)
VALUES (
    'admin@plus.com',
    '$2a$10$uq.kSIRZ8WfBDgrhXciEHea6nsKm2wCT/IOdLi.TGEMoh3mUsaVZ6',
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (
    email,
    password_hash,
    role
)
VALUES (
    'vendedor@plus.com',
    '$2a$10$uq.kSIRZ8WfBDgrhXciEHea6nsKm2wCT/IOdLi.TGEMoh3mUsaVZ6',
    'VENDEDOR'
)
ON CONFLICT (email) DO NOTHING;