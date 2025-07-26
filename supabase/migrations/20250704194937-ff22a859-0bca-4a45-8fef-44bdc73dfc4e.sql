
-- First, we need to find the user_id for sammyseth260@gmail.com and add them as admin
-- Since we can't directly query auth.users, we'll insert the admin role using the email
-- The user must have already signed up for this to work

-- Insert admin role for the user (replace the user_id with the actual UUID from auth.users)
-- You'll need to get the actual user_id from the Supabase Auth > Users panel
-- For now, I'll create a more flexible approach

-- Create a function to add admin role by email (for one-time use)
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user_id from auth.users table (this requires elevated privileges)
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Insert admin role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;

-- Call the function to add sammyseth260@gmail.com as admin
SELECT add_admin_by_email('sammyseth260@gmail.com');

-- Clean up the function after use
DROP FUNCTION add_admin_by_email(text);
