-- Fix RLS policies to avoid referencing auth.users table directly
-- Instead use the profiles table which is accessible

-- Drop existing policies that reference auth.users
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_ticket_messages;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create new policies using profiles table instead of auth.users
CREATE POLICY "Users can view their own tickets" 
ON support_tickets 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  customer_email = (
    SELECT p.user_id::text || '@' || split_part(p.display_name, '@', 2)
    FROM profiles p 
    WHERE p.user_id = auth.uid()
    LIMIT 1
  )
);

-- Create a simpler policy for ticket messages
CREATE POLICY "Users can view messages for their tickets" 
ON support_ticket_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM support_tickets st 
    WHERE st.id = support_ticket_messages.ticket_id 
    AND (st.user_id = auth.uid() OR st.customer_email IN (
      SELECT email FROM profiles WHERE user_id = auth.uid()
    ))
  )
);