-- ==============================================================================
-- CORALSWIFT ENTERPRISE - CREATE ADMIN USER IN SUPABASE AUTH
-- Run this script in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert admin user into auth.users (Replace email & password as desired)
DO $$
DECLARE
  admin_email TEXT := 'admin@coralswift.com';
  admin_password TEXT := 'CoralAdmin2026!';
  user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_id,
      format('{"sub":"%s","email":"%s"}', user_id, admin_email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Admin user % successfully created in Supabase Auth.', admin_email;
  ELSE
    RAISE NOTICE 'Admin user % already exists in Supabase Auth.', admin_email;
  END IF;
END $$;
