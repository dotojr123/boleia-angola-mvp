-- Seed Auth Data for Demo Users
-- Generated on 2026-01-30

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- Password 'password123' hash generated with bcryptjs
    -- $2a$10$wT0/K7j7j.0j/J/J/J/J/J/J/J/J/J/J/J/J/J/J/J/J/J/J/J is dummy, let's use a real one or generate via pgcrypto
    -- But since I am using pgcrypto here, I can use crypt('password123', gen_salt('bf'))
    pasword_hash text := crypt('password123', gen_salt('bf'));

    passageiro_id uuid;
    motorista_id uuid;
    admin_id uuid;
BEGIN

    -- Get IDs
    SELECT id INTO passageiro_id FROM profiles WHERE email = 'passageiro@demo.com';
    SELECT id INTO motorista_id FROM profiles WHERE email = 'motorista@demo.com';
    SELECT id INTO admin_id FROM profiles WHERE email = 'admin@demo.com';

    -- Insert Credentials if not exists

    IF passageiro_id IS NOT NULL THEN
        INSERT INTO auth_credentials (user_id, email, password_hash)
        VALUES (passageiro_id, 'passageiro@demo.com', pasword_hash)
        ON CONFLICT (email) DO NOTHING;
    END IF;

    IF motorista_id IS NOT NULL THEN
        INSERT INTO auth_credentials (user_id, email, password_hash)
        VALUES (motorista_id, 'motorista@demo.com', pasword_hash)
        ON CONFLICT (email) DO NOTHING;
    END IF;

    IF admin_id IS NOT NULL THEN
        INSERT INTO auth_credentials (user_id, email, password_hash)
        VALUES (admin_id, 'admin@demo.com', pasword_hash)
        ON CONFLICT (email) DO NOTHING;
    END IF;

END $$;
