-- Create admin user sammyseth260@gmail.com with password 58369234
-- This will be executed when the migration runs

DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Insert user into auth.users if not exists
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    )
    SELECT 
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'sammyseth260@gmail.com',
        crypt('58369234', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"display_name": "Admin User"}',
        false,
        'authenticated'
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'sammyseth260@gmail.com'
    )
    RETURNING id INTO user_id;

    -- Get the user_id if user already exists
    IF user_id IS NULL THEN
        SELECT id INTO user_id FROM auth.users WHERE email = 'sammyseth260@gmail.com';
    END IF;

    -- Insert user profile if not exists
    INSERT INTO public.profiles (
        id,
        user_id,
        display_name,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        user_id,
        'Admin User',
        now(),
        now()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE user_id = user_id
    );

    -- Make user admin if not already
    INSERT INTO public.user_roles (
        id,
        user_id,
        role,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        user_id,
        'admin',
        now()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = user_id AND role = 'admin'
    );

END $$;