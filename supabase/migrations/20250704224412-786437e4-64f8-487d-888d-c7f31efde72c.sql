-- Drop problematic policies that reference auth.users
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_ticket_messages;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create simpler policies without auth.users references
CREATE POLICY "Users can view their own tickets" 
ON support_tickets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view messages for their own tickets" 
ON support_ticket_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM support_tickets st 
    WHERE st.id = support_ticket_messages.ticket_id 
    AND st.user_id = auth.uid()
  )
);