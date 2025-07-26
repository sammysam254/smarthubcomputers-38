-- Add sammdev.ai@gmail.com as admin
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user_id from auth.users table
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sammdev.ai@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update profile with admin role
        INSERT INTO public.profiles (user_id, role, created_at, updated_at)
        VALUES (target_user_id, 'admin', now(), now())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = now();
            
        RAISE NOTICE 'Admin privileges granted to sammdev.ai@gmail.com';
    ELSE
        RAISE NOTICE 'User sammdev.ai@gmail.com not found in auth.users';
    END IF;
END $$;